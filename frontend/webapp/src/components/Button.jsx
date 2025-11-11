import React from 'react';
import '../styles/button.css';

/**
 * Button Component
 * Versatile button with multiple variants and states
 * 
 * Props:
 *   - children: button text or content
 *   - variant: 'primary', 'secondary', 'outlined' (default: 'primary')
 *   - size: 'sm', 'md', 'lg' (default: 'md')
 *   - isLoading: shows loading spinner (default: false)
 *   - disabled: disables button (default: false)
 *   - fullWidth: stretches to container width (default: false)
 *   - onClick: click handler
 *   - type: 'button', 'submit', 'reset' (default: 'button')
 *   - icon: optional icon element
 *   - ariaLabel: accessibility label
 *   - className: additional CSS classes
 */
const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  icon,
  ariaLabel,
  className = '',
  ...rest
}, ref) => {
  const buttonClass = [
    'button',
    `button-${variant}`,
    size === 'sm' && 'button-sm',
    size === 'lg' && 'button-lg',
    fullWidth && 'button-full',
    isLoading && 'is-loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      {...rest}
    >
      {icon && <span className="button-icon">{icon}</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
