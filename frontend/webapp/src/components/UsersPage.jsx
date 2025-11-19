import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Key } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Button from './Button';
import Card, { CardBody, CardHeader, CardFooter } from './Card';
import FormField from './FormField';
import '../styles/layout.css';

const API_URL = 'http://localhost:8000';

/**
 * UsersPage Component
 * Create users and generate key pairs
 */
const UsersPage = ({ selectedUser, setSelectedUser, onUserCreated }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [passphrase, setPassphrase] = useState('');


  // Validation
  const validateUsername = (value) => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must not exceed 20 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, hyphens, and underscores';
    return '';
  };

  const createUser = async (e) => {
    e.preventDefault();
    
    const error = validateUsername(username);
    if (error) {
      setErrors({ username: error });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/users/`, {
        username,
      });
      
      setUsers([...users, response.data]);
      setUsername('');
      toast.success(`User "${username}" created successfully!`);
      onUserCreated(response.data);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to create user';
      setErrors({ username: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

const generateKeys = async (selectedUsername) => {
    if (!passphrase) {
      toast.error("Passphrase is required");
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await axios.post(
        `${API_URL}/users/${selectedUsername}/generate_keys`,
        { passphrase },
        { responseType: 'blob' } // important to get file as blob
      );

      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedUsername}_private.asc`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Keys generated successfully! Private key downloaded.');
    } catch (error) {
      console.error(error.response?.data);
      const errorMsg = error.response?.data?.detail || 'Failed to generate keys';
      setErrors({ generate: errorMsg });
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
          <motion.h2 variants={itemVariants}>User Management</motion.h2>
          <motion.p variants={itemVariants}>Create users and manage cryptographic keys</motion.p>
        </div>

        <div className="grid grid-2">
          {/* Create User Card */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader title="Create New User" subtitle="Add a new user to the system" />
              <CardBody>
                <form onSubmit={createUser} className="form">
                  <FormField
                    label="Username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors({ ...errors, username: '' });
                    }}
                    onBlur={(e) => {
                      const error = validateUsername(e.target.value);
                      if (error) setErrors({ ...errors, username: error });
                    }}
                    error={errors.username}
                    placeholder="Enter username"
                    required
                    helperText="3-20 characters, alphanumeric with hyphens/underscores"
                    maxLength={20}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isLoading}
                    icon={<UserPlus size={18} />}
                  >
                    Create User
                  </Button>
                </form>
              </CardBody>
            </Card>
          </motion.div>

          {/* Generate Keys Card */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader title="Generate Keys" subtitle="Create public/private key pair" />
              <CardBody>
                <div className="form-group">
                  <label htmlFor="user-select" className="form-label">Select User</label>
                  <select
                    id="user-select"
                    className="form-select"
                    value={selectedUser?.username || ''}
                    onChange={(e) => {
                      const user = users.find(u => u.username === e.target.value);
                      setSelectedUser(user || null);
                    }}
                  >
                    <option value="">Choose a user...</option>
                    {users.map(user => (
                      <option key={user.username} value={user.username}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                  {errors.generate && (
                    <span className="form-error" role="alert">{errors.generate}</span>
                  )}
                </div>

                {selectedUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      marginBottom: '1rem',
                    }}
                  >
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Selected User:
                    </p>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {selectedUser.username}
                    </p>
                    
                    <input
                      type="password"
                      placeholder="Enter passphrase"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="form-input"
                    />

                  </motion.div>
                )}

                <Button
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  disabled={!selectedUser}
                  icon={<Key size={18} />}
                  onClick={() => generateKeys(selectedUser.username)}
                >
                  Generate Keys
                </Button>
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Keys Display */}
        {selectedUser?.public_key && (
          <motion.div
            variants={itemVariants}
            style={{ marginTop: '2rem' }}
          >
            <Card variant="primary">
              <CardHeader
                title="Generated Keys"
                subtitle={`Keys for ${selectedUser.username}`}
              />
              <CardBody>
                <div className="grid gap-lg">
                  {/* Public Key */}
                  <div>
                    <label className="form-label">Public Key</label>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1rem',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        wordBreak: 'break-all',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}
                    >
                      {selectedUser.public_key}
                    </div>
                  </div>

                  {/* Private Key */}
                  <div>
                    <label className="form-label">Private Key</label>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1rem',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        wordBreak: 'break-all',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}
                    >
                      {selectedUser.private_key}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

export default UsersPage;
