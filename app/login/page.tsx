'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OtpInput from '@/components/OtpInput';
import Image from 'next/image';

const LoginPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const validatePhone = (phoneNumber: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const setAuthCookie = (userData: any) => {
    // Set cookie for authentication
    document.cookie = `isAuthenticated=true; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
  };

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/gen-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: Number(phone) }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('OTP sent successfully!');
        setStep('otp');
        setResendTimer(30); // 30 seconds cooldown
        setCanResend(false);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: Number(phone), otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Login successful! Redirecting...');
        
        // Set authentication cookies
        setAuthCookie(data.user);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/gen-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: Number(phone) }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('OTP resent successfully!');
        setResendTimer(30);
        setCanResend(false);
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="login-container" style={{
      background: 'linear-gradient(135deg, #0a1f44 0%, #0e51a8 50%, #1e88e5 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="login-card-wrapper">
        <div className="login-features">
          <h2 className="features-title">Fleet Management System</h2>
          <div className="feature-item">
            <div className="feature-icon">🔍</div>
            <div className="feature-text">
              <h3>Real-time Tracking</h3>
              <p>Monitor your fleet's location and status in real-time</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <div className="feature-text">
              <h3>Analytics Dashboard</h3>
              <p>Comprehensive insights and performance metrics</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🔔</div>
            <div className="feature-text">
              <h3>Instant Alerts</h3>
              <p>Get notified about critical events and delays</p>
            </div>
          </div>
        </div>
        
        <div className="login-card" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#333',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          borderRadius: '16px'
        }}>
          <div className="login-header">
            <div className="login-logo" style={{
              background: 'linear-gradient(135deg, #1976d2, #2196f3)',
              width: '110px',
              height: '110px'
            }}>
              <span className="truck-icon">🚛</span>
              <span className="satellite-icon" style={{
                background: '#0a1f44'
              }}>📡</span>
            </div>
            <h1 className="login-title" style={{
              color: '#0a1f44',
              background: 'none',
              WebkitBackgroundClip: 'unset',
              WebkitTextFillColor: 'unset'
            }}>Vehicle Monitoring</h1>
            <h2 className="login-subtitle-main" style={{
              color: '#1976d2'
            }}>TRACKING DASHBOARD</h2>
            <p className="login-subtitle" style={{
              color: '#555'
            }}>
              {step === 'phone' ? 'Enter your phone number to continue' : 'Enter the OTP sent to your phone'}
            </p>
          </div>

          <div className="step-indicator">
            <div className={`step-dot ${step === 'phone' ? 'active' : 'completed'}`} style={{
              background: step === 'phone' ? '#1976d2' : step === 'otp' ? '#ccc' : '#4caf50'
            }}></div>
            <div className={`step-dot ${step === 'otp' ? 'active' : ''}`} style={{
              background: step === 'otp' ? '#1976d2' : '#ccc'
            }}></div>
          </div>

          {error && (
            <div className="error-message" style={{
              background: 'rgba(244, 67, 54, 0.1)',
              borderColor: 'rgba(244, 67, 54, 0.3)',
              color: '#f44336'
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" style={{
              background: 'rgba(76, 175, 80, 0.1)',
              borderColor: 'rgba(76, 175, 80, 0.3)',
              color: '#4caf50'
            }}>
              <span>✅</span>
              {success}
            </div>
          )}

          <form className="login-form" onSubmit={(e) => e.preventDefault()}>
            {step === 'phone' ? (
              <>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#0a1f44' }}>PHONE NUMBER</label>
                  <div className="phone-input">
                    <span className="phone-prefix" style={{ color: '#1976d2' }}>+91</span>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      disabled={loading}
                      style={{
                        background: 'rgba(25, 118, 210, 0.05)',
                        borderColor: 'rgba(25, 118, 210, 0.2)',
                        color: '#333'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="login-button"
                  onClick={handleSendOtp}
                  disabled={loading || phone.length !== 10}
                  style={{
                    background: 'linear-gradient(135deg, #1976d2, #2196f3)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#0a1f44' }}>ENTER OTP</label>
                  <OtpInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  className="login-button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  style={{
                    background: 'linear-gradient(135deg, #1976d2, #2196f3)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>

                <div className="resend-otp">
                  <p className="resend-text" style={{ color: '#555' }}>
                    Didn't receive the OTP?
                  </p>
                  <button
                    type="button"
                    className="resend-button"
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                    style={{ color: '#1976d2' }}
                  >
                    {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                  </button>
                </div>

                <button
                  type="button"
                  className="back-button"
                  onClick={handleBackToPhone}
                  style={{
                    borderColor: 'rgba(25, 118, 210, 0.2)',
                    color: '#1976d2'
                  }}
                >
                  ← Back to Phone Number
                </button>
              </>
            )}
          </form>
        </div>
      </div>
      
      <div className="login-footer">
        <p>© 2023 Fleet Monitoring System | Secure Login</p>
      </div>
    </div>
  );
};

export default LoginPage;