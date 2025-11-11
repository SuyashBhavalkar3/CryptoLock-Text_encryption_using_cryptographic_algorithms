import React from 'react';
import '../styles/layout.css';

/**
 * Card Component
 * Reusable glass-effect container for content
 * 
 * Props:
 *   - children: card content
 *   - variant: 'default', 'gradient', 'primary', 'success', 'error'
 *   - compact: reduces padding
 *   - className: additional CSS classes
 */
const Card = React.forwardRef(({
  children,
  variant = 'default',
  compact = false,
  className = '',
  ...rest
}, ref) => {
  const cardClass = [
    'card',
    variant !== 'default' && `card-${variant}`,
    compact && 'card-compact',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={cardClass} {...rest}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

/**
 * CardHeader Component
 */
export const CardHeader = ({ title, subtitle, children, className = '' }) => (
  <div className={`card-header ${className}`.trim()}>
    {title && <h3 className="card-title">{title}</h3>}
    {subtitle && <p className="card-subtitle">{subtitle}</p>}
    {children}
  </div>
);

/**
 * CardBody Component
 */
export const CardBody = ({ children, className = '' }) => (
  <div className={`card-body ${className}`.trim()}>
    {children}
  </div>
);

/**
 * CardFooter Component
 */
export const CardFooter = ({ children, className = '' }) => (
  <div className={`card-footer ${className}`.trim()}>
    {children}
  </div>
);

export default Card;
