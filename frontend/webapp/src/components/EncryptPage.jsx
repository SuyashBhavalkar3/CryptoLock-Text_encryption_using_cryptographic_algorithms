import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Button from './Button';
import CopyButton from './CopyButton';
import Card, { CardBody, CardHeader } from './Card';
import FormField from './FormField';
import TextArea from './TextArea';
import '../styles/layout.css';

const API_URL = "https://cryptolock-text-encryption-using-k3m4.onrender.com/";

/**
 * EncryptPage Component
 * Encrypt messages for other users
 */
const EncryptPage = () => {
  const [recipientUsername, setRecipientUsername] = useState('');
  const [message, setMessage] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!recipientUsername.trim()) newErrors.recipient = 'Recipient username is required';
    if (!message.trim()) newErrors.message = 'Message is required';
    return newErrors;
  };

  const encryptMessage = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/encrypt`, {
        recipient_username: recipientUsername,
        message,
      });
      
      setCiphertext(response.data.ciphertext);
      toast.success('Message encrypted successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Encryption failed';
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
          <motion.h2 variants={itemVariants}>Encrypt Message</motion.h2>
          <motion.p variants={itemVariants}>
            Securely encrypt messages for other users
          </motion.p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Encryption Form */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader
                title="Message Encryption"
                subtitle="Encrypt a message for a recipient"
                icon={<Lock size={24} />}
              />
              <CardBody>
                <form onSubmit={encryptMessage} className="form">
                  {/* Recipient Username */}
                  <FormField
                    label="Recipient Username"
                    type="text"
                    value={recipientUsername}
                    onChange={(e) => {
                      setRecipientUsername(e.target.value);
                      if (errors.recipient) setErrors({ ...errors, recipient: '' });
                    }}
                    error={errors.recipient}
                    placeholder="Enter recipient's username"
                    required
                    helperText="The recipient must have generated keys"
                  />

                  {/* Message */}
                  <TextArea
                    label="Message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errors.message) setErrors({ ...errors, message: '' });
                    }}
                    error={errors.message}
                    placeholder="Enter your message to encrypt"
                    rows={6}
                    required
                    helperText="Plain text message to be encrypted"
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
                    icon={<Lock size={18} />}
                  >
                    Encrypt Message
                  </Button>
                </form>
              </CardBody>
            </Card>
          </motion.div>

          {/* Ciphertext Output */}
          {ciphertext && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ marginTop: '2rem' }}
            >
              <Card variant="success">
                <CardHeader
                  title="Encrypted Message"
                  subtitle="Your encrypted ciphertext"
                />
                <CardBody>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      wordBreak: 'break-all',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      marginBottom: '1rem',
                    }}
                  >
                    {ciphertext}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <CopyButton
                      text={ciphertext}
                      label="Copy Ciphertext"
                      onCopy={() => toast.success('Ciphertext copied to clipboard!')}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setCiphertext('');
                        setMessage('');
                        setRecipientUsername('');
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

export default EncryptPage;
