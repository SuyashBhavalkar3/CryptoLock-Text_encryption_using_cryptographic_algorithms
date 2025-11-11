import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, Zap } from 'lucide-react';
import Button from './Button';
import Card, { CardBody, CardHeader } from './Card';
import '../styles/layout.css';

/**
 * HomePage Component
 * Landing page with hero section and feature cards
 */
const HomePage = ({ onNavigate }) => {
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
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const features = [
    {
      icon: <Lock size={32} />,
      title: 'Secure Messages',
      description: 'Encrypt your messages with military-grade RSA and AES algorithms.',
    },
    {
      icon: <Shield size={32} />,
      title: 'Key Management',
      description: 'Generate and manage cryptographic key pairs securely.',
    },
    {
      icon: <Zap size={32} />,
      title: 'Lightning Fast',
      description: 'Instant encryption and decryption with optimal performance.',
    },
  ];

  return (
    <motion.section
      className="section-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          {/* Hero Title */}
          <motion.h1
            className="gradient-text"
            variants={itemVariants}
            style={{ marginBottom: '1rem' }}
          >
            Secure Your Communication
          </motion.h1>

          {/* Hero Subtitle */}
          <motion.p
            variants={itemVariants}
            style={{
              fontSize: '1.25rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto 2rem',
              lineHeight: '1.8',
            }}
          >
            CryptoLock provides end-to-end encryption for your sensitive messages using advanced cryptographic algorithms.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '3rem',
            }}
          >
            <Button
              onClick={() => onNavigate('users')}
              variant="primary"
              size="lg"
            >
              Get Started
            </Button>
            <Button
              onClick={() => onNavigate('encrypt')}
              variant="secondary"
              size="lg"
            >
              Encrypt Message
            </Button>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            className="grid grid-3"
            variants={itemVariants}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Card variant="gradient">
                  <CardBody style={{ textAlign: 'center' }}>
                    <motion.div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                        color: 'var(--accent-primary)',
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 style={{ marginBottom: '0.5rem' }}>
                      {feature.title}
                    </h3>
                    <p style={{ margin: 0 }}>
                      {feature.description}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '2rem',
              marginTop: '3rem',
              padding: '2rem',
              backgroundColor: 'rgba(14, 165, 233, 0.05)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
            }}
          >
            <div>
              <h4 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--accent-primary)' }}>
                256-bit
              </h4>
              <p style={{ margin: 0 }}>Encryption Key</p>
            </div>
            <div>
              <h4 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--accent-secondary)' }}>
                AES
              </h4>
              <p style={{ margin: 0 }}>Algorithm</p>
            </div>
            <div>
              <h4 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--accent-tertiary)' }}>
                RSA
              </h4>
              <p style={{ margin: 0 }}>Key Exchange</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default HomePage;
