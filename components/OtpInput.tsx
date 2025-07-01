'use client';

import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({ length, value, onChange, disabled = false }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Initialize refs array
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    // Only allow single digits
    if (digit.length > 1) return;

    // Update the value
    const newValue = value.split('');
    newValue[index] = digit;
    const newOtp = newValue.join('');
    onChange(newOtp);

    // Move to next input if digit is entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Handle backspace
    if (e.key === 'Backspace') {
      if (value[index]) {
        // Clear current input
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // Move to previous input
        inputRefs.current[index - 1]?.focus();
      }
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '');
    if (pastedData.length === length) {
      onChange(pastedData);
      // Focus the last input
      inputRefs.current[length - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    if (disabled) return;
    // Select all text when focusing
    inputRefs.current[index]?.select();
  };

  const setRef = (index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  };

  const inputStyle = {
    width: '60px',
    height: '60px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '2px solid rgba(255, 255, 255, 0.7)',
    borderRadius: '12px',
    textAlign: 'center' as const,
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#fff',
    transition: 'all 0.3s ease'
  };

  const filledStyle = {
    ...inputStyle,
    // border: '2px solid #fff',
    background: 'rgba(255, 255, 255, 0.15)',
    boxShadow: '0 0 10px rgba(255,255,255,0.15)'
  };

  return (
    <div className="otp-container" style={{ display: 'flex', gap: '12px' }}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={setRef(index)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          style={value[index] ? filledStyle : inputStyle}
          disabled={disabled}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};

export default OtpInput; 