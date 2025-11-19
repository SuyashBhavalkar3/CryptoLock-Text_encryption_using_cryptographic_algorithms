import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Unlock, Upload } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Button from './Button';
import CopyButton from './CopyButton';
import Card, { CardBody, CardHeader } from './Card';
import FormField from './FormField';
import TextArea from './TextArea';
import '../styles/layout.css';
import '../styles/form.css';

const API_URL = "https://cryptolock-text-encryption-using-k3m4.onrender.com";


/**
 * DecryptPage Component
 * Decrypt messages using private key
 */
const DecryptPage = () => {
  const [ciphertext, setCiphertext] = useState('');
  const [privateKeyFile, setPrivateKeyFile] = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState('');
  const [username, setUsername] = useState('');


  const validateForm = () => {
    const newErrors = {};
    if (!ciphertext.trim()) newErrors.ciphertext = 'Ciphertext is required';
    if (!privateKeyFile) newErrors.privateKey = 'Private key file is required';
    if (!passphrase.trim()) newErrors.passphrase = 'Passphrase is required';
    return newErrors;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFileError('File size must be less than 10MB');
        setPrivateKeyFile(null);
        return;
      }
      setPrivateKeyFile(file);
      setFileError('');
    }
  };


  const decryptMessage = async (e) => {
  e.preventDefault();

  // Example: dynamically fetched username
if (!username.trim()) {
  toast.error("Username is required");
  setErrors({ username: "Username is required" });
  return;
}


  if (!ciphertext.trim()) {
    setErrors({ ciphertext: "Ciphertext is required" });
    return;
  }
  if (!privateKeyFile) {
    setErrors({ privateKey: "Private key file is required" });
    return;
  }

  setIsLoading(true);
  setErrors({});

  try {
    // Read private key file as text
    const privateKeyArmored = await privateKeyFile.text();

    const response = await axios.post(`${API_URL}/decrypt`, {
    username,  // now dynamically taken from input
    ciphertext_armored: ciphertext,
    private_key_armored: privateKeyArmored,
    passphrase: passphrase || undefined,
  });


    setPlaintext(response.data.plaintext);
    toast.success("Message decrypted successfully!");
  } catch (error) {
    console.error(error.response?.data);
    const errorMsg = error.response?.data?.detail || "Decryption failed";
    setErrors({ submit: errorMsg });
    toast.error(errorMsg);
  } finally {
    setIsLoading(false);
  }
};


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <motion.section
      className="section"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container">
        <div className="section-header">
          <motion.h2 variants={itemVariants}>Decrypt Message</motion.h2>
          <motion.p variants={itemVariants}>
            Decrypt encrypted messages using your private key
          </motion.p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Decryption Form */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader
                title="Message Decryption"
                subtitle="Decrypt a message with your private key"
              />
              <CardBody>
                <form onSubmit={decryptMessage} className="form">
                  {/* Ciphertext */}
                  <TextArea
                    label="Encrypted Message (Ciphertext)"
                    value={ciphertext}
                    onChange={(e) => {
                      setCiphertext(e.target.value);
                      if (errors.ciphertext) setErrors({ ...errors, ciphertext: '' });
                    }}
                    error={errors.ciphertext}
                    placeholder="Paste the encrypted message here"
                    rows={6}
                    required
                    helperText="The encrypted message to decrypt"
                  />

                  {/* Private Key File Upload */}
                  <div className="form-group">
                    <label htmlFor="private-key" className="form-label required">
                      Private Key File
                    </label>
                    <div className="form-file-input">
                      <input
                        id="private-key"
                        type="file"
                        onChange={handleFileChange}
                        aria-describedby={fileError ? 'file-error' : undefined}
                        aria-invalid={!!fileError}
                      />
                      <label htmlFor="private-key" className="form-file-label">
                        <Upload size={20} style={{ marginRight: '0.5rem' }} />
                        {privateKeyFile ? privateKeyFile.name : 'Click to upload or drag & drop'}
                      </label>
                    </div>
                    {fileError && (
                      <span id="file-error" className="form-error" role="alert">
                        {fileError}
                      </span>
                    )}
                    {errors.privateKey && (
                      <span className="form-error" role="alert">
                        {errors.privateKey}
                      </span>
                    )}
                  </div>

                  {/* Passphrase */}
                  <FormField
                    label="Passphrase"
                    type="password"
                    value={passphrase}
                    onChange={(e) => {
                      setPassphrase(e.target.value);
                      if (errors.passphrase) setErrors({ ...errors, passphrase: '' });
                    }}
                    error={errors.passphrase}
                    placeholder="Enter the passphrase for your private key"
                    required
                    helperText="The passphrase used to encrypt your private key"
                  />

                  <FormField
                    label="Username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />

                  {errors.submit && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '1rem',
                      }}
                    >
                      <p style={{ margin: 0, color: 'var(--error)' }}>
                        {errors.submit}
                      </p>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    icon={<Unlock size={18} />}
                  >
                    Decrypt Message
                  </Button>
                </form>
              </CardBody>
            </Card>
          </motion.div>

          {/* Plaintext Output */}
          {plaintext && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ marginTop: '2rem' }}
            >
              <Card variant="success">
                <CardHeader
                  title="Decrypted Message"
                  subtitle="Your original message"
                />
                <CardBody>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      minHeight: '150px',
                      display: 'flex',
                      alignItems: 'center',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      marginBottom: '1rem',
                    }}
                  >
                    {plaintext}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <CopyButton
                      text={plaintext}
                      label="Copy Message"
                      onCopy={() => toast.success('Message copied to clipboard!')}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setPlaintext('');
                        setCiphertext('');
                        setPassphrase('');
                        setPrivateKeyFile(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default DecryptPage;
