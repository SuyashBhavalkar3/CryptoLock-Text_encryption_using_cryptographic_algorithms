import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import '../styles/button.css';

/**
 * CopyButton Component
 * Button that copies text to clipboard with visual feedback
 * 
 * Props:
 *   - text: text to copy
 *   - label: button label
 *   - successMessage: message shown on successful copy
 */
const CopyButton = ({ 
  text, 
  label = 'Copy', 
  successMessage = 'Copied!',
  onCopy = () => {},
  variant = 'secondary',
  size = 'md',
  className = '',
  ...rest 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      className={`button button-${variant} ${size === 'sm' ? 'button-sm' : ''} ${className}`.trim()}
      onClick={handleCopy}
      title={copied ? successMessage : label}
      aria-label={copied ? `${successMessage}!` : label}
      {...rest}
    >
      {copied ? (
        <>
          <Check size={18} />
          {successMessage}
        </>
      ) : (
        <>
          <Copy size={18} />
          {label}
        </>
      )}
    </button>
  );
};

export default CopyButton;
