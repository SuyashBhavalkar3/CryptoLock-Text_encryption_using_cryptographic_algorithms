import React from 'react';
import '../styles/form.css';

/**
 * FormField Component
 * Reusable form input with label, error message, and validation states
 * 
 * Props:
 *   - label: field label text
 *   - type: input type (text, password, email, number, etc.)
 *   - value: controlled input value
 *   - onChange: change handler
 *   - error: error message (shows error state if present)
 *   - success: success message/state
 *   - placeholder: placeholder text
 *   - required: marks field as required
 *   - disabled: disables field
 *   - helperText: helper text below field
 *   - maxLength: max characters
 *   - ariaLabel: accessibility label
 *   - ariaDescribedBy: accessibility description
 *   - className: additional CSS classes
 */
const FormField = React.forwardRef(({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  placeholder,
  required = false,
  disabled = false,
  helperText,
  maxLength,
  ariaLabel,
  ariaDescribedBy,
  id,
  className = '',
  ...rest
}, ref) => {
  const uniqueId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${uniqueId}-error`;
  const helperId = `${uniqueId}-help`;

  const inputClass = [
    'form-input',
    error && 'error',
    success && 'success',
    className,
  ].filter(Boolean).join(' ');

  const describedBy = [
    error && errorId,
    helperText && helperId,
    ariaDescribedBy,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={uniqueId} className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={uniqueId}
        type={type}
        className={inputClass}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        required={required}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        {...rest}
      />
      {error && (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={helperId} className="form-help">
          {helperText}
        </span>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
