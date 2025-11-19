import React from 'react';
import '../styles/form.css';

/**
 * TextArea Component
 * Reusable textarea input with label, error message, and validation states
 * 
 * Props:
 *   - label: field label text
 *   - value: controlled input value
 *   - onChange: change handler
 *   - error: error message
 *   - success: success state
 *   - placeholder: placeholder text
 *   - required: marks field as required
 *   - disabled: disables field
 *   - rows: number of rows
 *   - maxLength: max characters
 *   - helperText: helper text below field
 *   - id: unique identifier
 */
const TextArea = React.forwardRef(({
  label,
  value,
  onChange,
  onBlur,
  error,
  success,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  helperText,
  id,
  className = '',
  ...rest
}, ref) => {
  const uniqueId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${uniqueId}-error`;
  const helperId = `${uniqueId}-help`;

  const textareaClass = [
    'form-textarea',
    error && 'error',
    success && 'success',
    className,
  ].filter(Boolean).join(' ');

  const describedBy = [
    error && errorId,
    helperText && helperId,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={uniqueId} className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={uniqueId}
        className={textareaClass}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        {...rest}
      />
      {maxLength && (
        <small className="form-help">
          {value?.length || 0} / {maxLength} characters
        </small>
      )}
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

TextArea.displayName = 'TextArea';

export default TextArea;
