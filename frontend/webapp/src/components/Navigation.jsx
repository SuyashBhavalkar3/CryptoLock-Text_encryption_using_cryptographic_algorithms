import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import '../styles/navbar.css';

/**
 * Navigation Component
 * Sticky header with desktop and mobile menus
 * 
 * Props:
 *   - currentPage: active page name
 *   - onNavigate: navigation handler
 *   - navItems: array of {label, id}
 */
const Navigation = ({ currentPage, onNavigate, navItems = [] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar-container">
        {/* Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="navbar-logo"
          aria-label="CryptoLock - Go to home"
        >
          <div className="navbar-logo-icon">🔐</div>
          <span>CryptoLock</span>
        </button>

        {/* Desktop Navigation */}
        <ul className="navbar-nav">
          {navItems.map(item => (
            <li key={item.id} className="navbar-nav-item">
              <button
                onClick={() => handleNavClick(item.id)}
                className={`navbar-nav-link ${currentPage === item.id ? 'active' : ''}`}
                aria-current={currentPage === item.id ? 'page' : undefined}
              >
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button
          className="navbar-mobile-btn"
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`navbar-mobile-menu ${mobileMenuOpen ? 'active' : ''}`}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <ul className="navbar-mobile-nav">
            {navItems.map(item => (
              <li key={item.id} className="navbar-mobile-nav-item">
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`navbar-mobile-nav-link ${currentPage === item.id ? 'active' : ''}`}
                  aria-current={currentPage === item.id ? 'page' : undefined}
                >
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
