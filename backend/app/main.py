# app/main.py
# FastAPI GPG service refactored to use PGPy instead of python-gnupg.
# Functionality preserved:
# - Public keys stored in DB
# - Private keys never stored server-side (downloaded to client)
# - /users/, /users/{username}/upload_pubkey, /users/{username}/public_key,
#   /users/{username}/generate_keys, /encrypt, /decrypt

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import PlainTextResponse, StreamingResponse
from sqlmodel import SQLModel, Field, create_engine, Session, select
from typing import Optional
from contextlib import contextmanager
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import io
import logging
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

# PGPy imports
from pgpy import PGPKey, PGPUID, PGPMessage
from pgpy.constants import (
    PubKeyAlgorithm,
    KeyFlags,
    HashAlgorithm,
    SymmetricKeyAlgorithm,
    CompressionAlgorithm,
)

# -------------------- FastAPI App --------------------
app = FastAPI(title="FastAPI GPG Service (PGPy)")

# Allow frontend origin
origins = [
    "http://localhost:5173",  # frontend URL
    "http://127.0.0.1:5173",
    "https://crypto-lock-text-encryption-using-c.vercel.app"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------- Logging --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.main")

# -------------------- Load environment --------------------
load_dotenv()

# Normalize and safely read directories / DB
_raw_data_dir = os.getenv("DATA_DIR", "./data")
DATA_DIR = str(Path(_raw_data_dir).as_posix())
os.makedirs(DATA_DIR, exist_ok=True)

LOCAL_TMP_DIR = os.path.join(os.getcwd(), "data", "tmp")
os.makedirs(LOCAL_TMP_DIR, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(DATA_DIR, 'data.db')}")
os.makedirs(os.path.dirname(DATABASE_URL.replace("sqlite:///", "")), exist_ok=True)

# -------------------- Initialize Database --------------------
engine = create_engine(DATABASE_URL, echo=True, future=True)

# -------------------- Models --------------------
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    public_key: Optional[str] = None  # Server stores only public key


class GenerateKeyRequest(BaseModel):
    passphrase: str

class UserCreate(BaseModel):
    username: str

class EncryptRequest(BaseModel):
    recipient_username: str
    message: str

class DecryptRequest(BaseModel):
    username: str
    ciphertext_armored: str
    private_key_armored: str  # Client provides private key (never persisted)
    passphrase: Optional[str] = None  # Optional passphrase if the private key is protected

# -------------------- DB session helper --------------------
@contextmanager
def get_session():
    with Session(engine) as session:
        yield session

# -------------------- Utility helpers --------------------
def normalize_armored(s: Optional[str]) -> Optional[str]:
    """Normalize line endings and strip leading/trailing whitespace from an armored block."""
    if s is None:
        return s
    # Accept either CRLF or LF in input; ensure final newline for PGPy consumption
    return s.replace("\r\n", "\n").strip() + "\n"

# -------------------- Startup --------------------
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    logger.info(f"DATA_DIR = {DATA_DIR}")
    logger.info("Database ready")

# -------------------- Routes --------------------

@app.get("/")
def root():
    return {"message": "Welcome to FastAPI GPG Service (PGPy)"}

@app.post("/users/", response_model=dict)
def create_user(u: UserCreate):
    with get_session() as session:
        existing = session.exec(select(User).where(User.username == u.username)).first()
        if existing:
            raise HTTPException(status_code=400, detail="username exists")
        user = User(username=u.username)
        session.add(user)
        session.commit()
        session.refresh(user)
        logger.info(f"Created user {u.username} (id={user.id})")
        return {"id": user.id, "username": user.username}

@app.post("/users/{username}/upload_pubkey")
def upload_pubkey(username: str, file: UploadFile = File(...)):
    try:
        raw = file.file.read()
        if not raw:
            raise HTTPException(status_code=400, detail="Empty file")
        content = raw.decode("utf-8")
        content = normalize_armored(content)

        # Validate / parse public key using PGPy
        try:
            key_obj, _ = PGPKey.from_blob(content)
            # Ensure it's a public key (i.e., has no private key material)
            if key_obj.is_protected or key_obj.is_private:
                # If user accidentally uploaded private key, reject
                raise HTTPException(status_code=400, detail="Uploaded key appears to be a private key; please upload the public key only")
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Public key parse/import failed")
            raise HTTPException(status_code=400, detail=f"Invalid public key: {str(e)}")

        # store public key in DB
        with get_session() as session:
            user = session.exec(select(User).where(User.username == username)).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            user.public_key = content
            session.add(user)
            session.commit()
        logger.info(f"Uploaded public key for user {username}")
        return {"status": "ok", "imported_keys": 1}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to upload public key")
        raise HTTPException(status_code=500, detail=f"Failed to upload public key: {str(e)}")

@app.get("/users/{username}/public_key", response_class=PlainTextResponse)
def get_public_key(username: str):
    with get_session() as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if not user or not user.public_key:
            raise HTTPException(status_code=404, detail="Public key not found")
        return user.public_key

@app.post("/users/{username}/generate_keys")
def generate_keys(username: str, req: GenerateKeyRequest):
    """
    Generate an RSA 2048 keypair for the username.
    Public key stored in DB; private key returned as downloadable file (armored).
    Matches previous behavior (name_real=username, name_email={username}@example.com).
    """
    try:
        with get_session() as session:
            user = session.exec(select(User).where(User.username == username)).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            if user.public_key:
                raise HTTPException(status_code=400, detail="Public key already exists")

        # Create primary RSA key (encrypt + sign) of 2048 bits to mimic previous gnupg behavior
        key = PGPKey.new(PubKeyAlgorithm.RSAEncryptOrSign, 2048)

        # Create user id
        uid = PGPUID.new(username, email=f"{username}@example.com")

        # Add the user id to the key with typical usage (signing + encryption)
        key.add_uid(
            uid,
            usage={KeyFlags.Sign, KeyFlags.EncryptCommunications, KeyFlags.EncryptStorage},
            hashes=[HashAlgorithm.SHA256],
            ciphers=[SymmetricKeyAlgorithm.AES256],
            compression=[CompressionAlgorithm.ZLIB]
        )

        # Protect (encrypt) the private key with provided passphrase
        # If passphrase is empty string, we still protect with given value (that's how original did it)
        passphrase = req.passphrase or ""
        if passphrase:
            key.protect(passphrase, SymmetricKeyAlgorithm.AES256, HashAlgorithm.SHA256)
        else:
            # If empty passphrase, do not protect (mirrors behavior when user passes empty)
            # But to keep parity with original, we will still allow empty passphrase to be used.
            # PGPy doesn't accept empty passphrase for protect; skip in that case.
            pass

        # Export public and private keys as armored strings
        public_key_armored = str(key.pubkey)
        # Private export includes secret material; str(key) includes private block if present
        private_key_armored = str(key)

        # Persist public key to DB
        with get_session() as session:
            user = session.exec(select(User).where(User.username == username)).first()
            user.public_key = normalize_armored(public_key_armored)
            session.add(user)
            session.commit()

        # Return private key as download (same as original StreamingResponse)
        private_bytes = io.BytesIO(private_key_armored.encode("utf-8"))
        return StreamingResponse(
            private_bytes,
            media_type="application/pgp-keys",
            headers={"Content-Disposition": f"attachment; filename={username}_private.asc"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error during key generation")
        raise HTTPException(status_code=500, detail=f"Key generation failed: {str(e)}")

@app.post("/encrypt")
def encrypt(req: EncryptRequest):
    """
    Encrypt a message for a recipient using their stored public key.
    Uses PGPy to parse the stored public key and encrypt in-memory.
    """
    try:
        with get_session() as session:
            recipient = session.exec(select(User).where(User.username == req.recipient_username)).first()
            if not recipient or not recipient.public_key:
                raise HTTPException(status_code=404, detail="Recipient public key not found")
        pub = normalize_armored(recipient.public_key)

        try:
            pubkey, _ = PGPKey.from_blob(pub)
        except Exception as e:
            logger.exception("Failed to parse recipient public key")
            raise HTTPException(status_code=500, detail=f"Failed to parse recipient public key: {str(e)}")

        # Create PGP message
        message = PGPMessage.new(req.message)

        # Encrypt with recipient public key; result is a PGPMessage
        try:
            encrypted_msg = pubkey.encrypt(message)
        except Exception as e:
            logger.exception("Encryption failed")
            raise HTTPException(status_code=500, detail=f"Encryption failed: {str(e)}")

        return {"ciphertext": str(encrypted_msg)}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during encryption")
        raise HTTPException(status_code=500, detail=f"Encryption error: {str(e)}")

@app.post("/decrypt")
def decrypt(req: DecryptRequest):
    """
    Decrypt using a client-provided private key (armored) in-memory.
    Private key is never persisted on server.
    """
    try:
        ciphertext = normalize_armored(req.ciphertext_armored)
        private_armored = normalize_armored(req.private_key_armored)

        if not ciphertext:
            raise HTTPException(status_code=400, detail="Missing ciphertext")
        if not private_armored:
            raise HTTPException(status_code=400, detail="Missing private key")

        # Parse ciphertext and private key
        try:
            cipher_msg = PGPMessage.from_blob(ciphertext)
        except Exception as e:
            logger.exception("Failed to parse ciphertext")
            raise HTTPException(status_code=400, detail=f"Invalid ciphertext: {str(e)}")

        try:
            privkey, _ = PGPKey.from_blob(private_armored)
        except Exception as e:
            logger.exception("Failed to parse private key")
            raise HTTPException(status_code=400, detail=f"Invalid private key: {str(e)}")

        # If protected, unlock using passphrase (context manager)
        try:
            if privkey.is_protected:
                if req.passphrase is None:
                    raise HTTPException(status_code=400, detail="Private key is passphrase-protected; passphrase required")
                with privkey.unlock(req.passphrase):
                    plaintext_msg = privkey.decrypt(cipher_msg)
            else:
                plaintext_msg = privkey.decrypt(cipher_msg)
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Decryption failed")
            # PGPy raises on bad passphrase or other errors; surface as 400 similarly to original
            raise HTTPException(status_code=400, detail=f"Decryption failed: {str(e)}")

        return {"plaintext": str(plaintext_msg.message)}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during decryption")
        raise HTTPException(status_code=500, detail=f"Decryption error: {str(e)}")
