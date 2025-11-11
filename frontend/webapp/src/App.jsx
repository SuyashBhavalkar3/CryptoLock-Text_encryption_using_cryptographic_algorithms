import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  Navigation,
  Footer,
  HomePage,
  UsersPage,
  EncryptPage,
  DecryptPage,
} from './components';

import './index.css';
import './styles/button.css';
import './styles/form.css';
import './styles/layout.css';
import './styles/navbar.css';
import './styles/footer.css';

/**
 * CryptoLock App
 * Secure message encryption and decryption application
 * 
 * Pages:
 *   - Home: Landing page with features
 *   - Users: User creation and key generation
 *   - Encrypt: Message encryption
 *   - Decrypt: Message decryption
 */
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedUser, setSelectedUser] = useState(null);

  // Navigation items
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'encrypt', label: 'Encrypt', icon: '🔒' },
    { id: 'decrypt', label: 'Decrypt', icon: '🔓' },
  ];

  // Page transition animation
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'users':
        return (
          <UsersPage
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            onUserCreated={(user) => setSelectedUser(user)}
          />
        );
      case 'encrypt':
        return <EncryptPage />;
      case 'decrypt':
        return <DecryptPage />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation */}
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        navItems={navItems}
      />

      {/* Main Content */}
      <main style={{ flex: 1 }} role="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{
          '--toastify-color-light': 'rgba(15, 20, 25, 0.9)',
          '--toastify-color-dark': 'rgba(15, 20, 25, 0.9)',
          '--toastify-text-color-light': '#ffffff',
        }}
      />
    </div>
  );
}

export default App;