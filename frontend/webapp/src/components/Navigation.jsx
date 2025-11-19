import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import '../styles/navbar.css';

/**
 * Navigation Component
 * Sticky header with desktop and mobile menus
 * 
 * Props:
 *   - currentPage: active page name
 *   - onNavigate: navigation handler
 *   - navItems: array of {label, id, icon}
 */
const Navigation = ({ currentPage, onNavigate, navItems = [] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'auto';
  }, [mobileMenuOpen]);

  return (
    <nav className="navbar" ref={navRef} style={{ '--navbar-height': '64px' }}>
      <div className="navbar-container">
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
      </div>

      {/* Mobile Menu (outside container for proper overlay) */}
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
    </nav>
  );
};

export default Navigation;
