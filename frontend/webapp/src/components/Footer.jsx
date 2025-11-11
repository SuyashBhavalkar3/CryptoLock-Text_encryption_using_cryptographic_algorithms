import React from 'react';
import '../styles/footer.css';

/**
 * Footer Component
 * Site footer with links and copyright
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-content">
          {/* About Section */}
          <div className="footer-section">
            <h3>About CryptoLock</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
              Secure message encryption and decryption using advanced cryptographic algorithms.
            </p>
          </div>

          {/* Features Section */}
          <div className="footer-section">
            <h3>Features</h3>
            <ul>
              <li><a href="#features">User Management</a></li>
              <li><a href="#features">Key Generation</a></li>
              <li><a href="#features">Message Encryption</a></li>
              <li><a href="#features">Message Decryption</a></li>
            </ul>
          </div>

          {/* Security Section */}
          <div className="footer-section">
            <h3>Security</h3>
            <ul>
              <li><a href="#security">RSA Encryption</a></li>
              <li><a href="#security">AES Encryption</a></li>
              <li><a href="#security">End-to-End</a></li>
              <li><a href="#security">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} CryptoLock. All rights reserved.
          </p>
          <div className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
