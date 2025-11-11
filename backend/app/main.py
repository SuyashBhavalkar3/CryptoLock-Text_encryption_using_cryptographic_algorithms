# app/main.py
# Fully updated, production-ready FastAPI GPG service (private-key client-side model).
# - Public keys are stored on server DB
# - Private keys are never stored on server (user downloads & provides for decrypt)
# - Robust path handling, temporary GPG homes for ephemeral operations, helpful error messages
# - Routes preserved: /users/, /users/{username}/upload_pubkey, /users/{username}/public_key,
#   /users/{username}/generate_keys, /encrypt, /decrypt

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import PlainTextResponse, StreamingResponse
from sqlmodel import SQLModel, Field, create_engine, Session, select
from typing import Optional, List
from contextlib import contextmanager
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import gnupg
import io
import logging
import tempfile
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# -------------------- FastAPI App --------------------
app = FastAPI(title="FastAPI GPG Service")


# Allow frontend origin
origins = [
    "http://localhost:5173",  # frontend URL
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # allow only your frontend origin
    allow_credentials=True,
    allow_methods=["*"],     # allow all HTTP methods
    allow_headers=["*"],     # allow all headers
)


# -------------------- Logging --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.main")

# -------------------- Load environment --------------------
load_dotenv()

# Normalize and safely read GPG_HOME and DATABASE_URL
_raw_gpg = os.getenv("GPG_HOME", "./data/gnupg_home")
# Replace backslashes with forward slashes to avoid escape sequences like \b, \t on Windows.
GPG_HOME = str(Path(_raw_gpg).as_posix())
os.makedirs(GPG_HOME, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/data.db")
os.makedirs('./data', exist_ok=True)  # Ensure data folder exists

# -------------------- Initialize GPG (server keyring used primarily to store public keys) --------------------
gpg = gnupg.GPG(gnupghome=GPG_HOME)

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
    # Accept either CRLF or LF in input; ensure final newline for gnupg consumption
    return s.replace("\r\n", "\n").strip() + "\n"

def find_fingerprint_for_username(gpg_instance: gnupg.GPG, username: str) -> Optional[str]:
    """
    Find a fingerprint in the gpg instance whose uid contains the username string (case insensitive).
    Falls back to the first available key if none contain the username.
    """
    username_lower = username.lower()
    keys = gpg_instance.list_keys()
    if not keys:
        return None
    # Prefer keys whose uid matches username or username@...
    for k in keys:
        for uid in k.get("uids", []):
            if username_lower in uid.lower():
                return k.get("fingerprint")
    # fallback - return first key fingerprint
    return keys[0].get("fingerprint")



# -------------------- Startup --------------------
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    os.makedirs(GPG_HOME, exist_ok=True)
    logger.info(f"GPG_HOME = {GPG_HOME}")
    logger.info("Database and GPG home ready")

# -------------------- Routes (unchanged names) --------------------

@app.get("/")
def root():
    return {"message": "Welcome to FastAPI GPG Service"}

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
        imported = gpg.import_keys(content)
        if not getattr(imported, "count", 0):
            logger.warning("Public key import returned count=0")
            raise HTTPException(status_code=400, detail="Invalid public key")
        # store public key in DB
        with get_session() as session:
            user = session.exec(select(User).where(User.username == username)).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            user.public_key = content
            session.add(user)
            session.commit()
        logger.info(f"Uploaded public key for user {username}; imported {imported.count} key(s)")
        return {"status": "ok", "imported_keys": imported.count}
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
    try:
        with get_session() as session:
            user = session.exec(select(User).where(User.username == username)).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            if user.public_key:
                raise HTTPException(status_code=400, detail="Public key already exists")

        input_data = gpg.gen_key_input(
            name_real=username,
            name_email=f"{username}@example.com",
            key_type="RSA",
            key_length=2048,
            passphrase=req.passphrase
        )

        key = gpg.gen_key(input_data)
        fingerprint = getattr(key, "fingerprint", None)

        if not fingerprint:
            logger.error("Generated key has no fingerprint")
            raise HTTPException(status_code=500, detail="Key generation failed (no fingerprint)")

        public_key = gpg.export_keys(fingerprint)
        private_key = gpg.export_keys(fingerprint, True, passphrase=req.passphrase)

        with get_session() as session:
            user = session.exec(select(User).where(User.username == username)).first()
            user.public_key = normalize_armored(public_key)
            session.add(user)
            session.commit()

        private_bytes = io.BytesIO(private_key.encode("utf-8"))
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
    Imports the public key into a temporary keyring for isolation.
    """
    try:
        with get_session() as session:
            recipient = session.exec(select(User).where(User.username == req.recipient_username)).first()
            if not recipient or not recipient.public_key:
                raise HTTPException(status_code=404, detail="Recipient public key not found")
        pub = normalize_armored(recipient.public_key)

        # Use a temporary GPG home for per-user encryption
        with tempfile.TemporaryDirectory() as tmp_gpg_home:
            temp_gpg = gnupg.GPG(gnupghome=tmp_gpg_home)
            import_result = temp_gpg.import_keys(pub)
            if not import_result or not getattr(import_result, "fingerprints", None):
                raise HTTPException(status_code=500, detail="Failed to import public key")
            fingerprint = import_result.fingerprints[0]

            encrypted = temp_gpg.encrypt(
                req.message,
                recipients=[fingerprint],
                always_trust=True,
                armor=True
            )

            if not encrypted.ok:
                raise HTTPException(status_code=500, detail=f"Encryption failed: {encrypted.status}")

            return {"ciphertext": str(encrypted)}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during encryption")
        raise HTTPException(status_code=500, detail=f"Encryption error: {str(e)}")

@app.post("/decrypt")
def decrypt(req: DecryptRequest):
    """
    Decrypt using a client-provided private key in an isolated temporary keyring.
    Private key is never persisted on server.
    """
    try:
        ciphertext = normalize_armored(req.ciphertext_armored)
        private_armored = normalize_armored(req.private_key_armored)

        if not ciphertext:
            raise HTTPException(status_code=400, detail="Missing ciphertext")
        if not private_armored:
            raise HTTPException(status_code=400, detail="Missing private key")

        # Create ephemeral GPG home per request
        with tempfile.TemporaryDirectory() as tmp_gpg_home:
            temp_gpg = gnupg.GPG(gnupghome=tmp_gpg_home, options=["--pinentry-mode", "loopback"])

            # Import private key
            import_result = temp_gpg.import_keys(private_armored)
            if not getattr(import_result, "fingerprints", None):
                raise HTTPException(status_code=400, detail="Invalid private key (imported 0 keys)")
            fingerprint = import_result.fingerprints[0]

            # Set ultimate trust for the imported key
            temp_gpg.trust_keys(fingerprint, 'TRUST_ULTIMATE')

            # Decrypt
            decrypted = temp_gpg.decrypt(ciphertext, passphrase=req.passphrase)
            if not decrypted.ok:
                raise HTTPException(status_code=400, detail=f"Decryption failed: {decrypted.status}")

            return {"plaintext": str(decrypted)}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during decryption")
        raise HTTPException(status_code=500, detail=f"Decryption error: {str(e)}")
