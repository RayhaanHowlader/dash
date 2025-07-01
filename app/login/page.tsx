'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OtpInput from '@/components/OtpInput';
import Image from 'next/image';
import { CiMobile1 } from "react-icons/ci";

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
  const [buttonSuccess, setButtonSuccess] = useState(false);
  const [buttonAnimating, setButtonAnimating] = useState(false);
  const [verifyButtonAnimating, setVerifyButtonAnimating] = useState(false);
  const [verifyButtonSuccess, setVerifyButtonSuccess] = useState(false);

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
        setButtonAnimating(true);
        setTimeout(() => {
          setButtonAnimating(false);
          setButtonSuccess(true);
          setTimeout(() => {
            setButtonSuccess(false);
            setVerifyButtonAnimating(false);
            setVerifyButtonSuccess(false);
            setStep('otp');
            setResendTimer(30);
            setCanResend(false);
          }, 700);
        }, 1100);
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

    setVerifyButtonAnimating(true);
    setError('');

    setTimeout(async () => {
      setVerifyButtonAnimating(false);
      setVerifyButtonSuccess(true);
      setLoading(true);
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
          setAuthCookie(data.user);
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
        setTimeout(() => setVerifyButtonSuccess(false), 700);
      }
    }, 700);
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
    <div className="login-container">
      <div className="login-card-wrapper">
        <div className="login-card">
          <div className="login-header flex flex-col items-center mb-6">
            <Image src="/logo1.png" alt="apml-logo" width={100} height={100} />
            <h1 className="login-title">Vehicle Monitoring</h1>
            <h2 className="login-subtitle-main">TRACKING DASHBOARD</h2>
            <p className="login-subtitle">
              {step === 'phone' ? '' : ''}
            </p>
          </div>
    
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              {error}
            </div>
          )}
          {success && (
            <div className="success-message">
           
       
            </div>
          )}
          <form className="login-form" onSubmit={(e) => e.preventDefault()}>
            {step === 'phone' ? (
              <>
                <div className=" w-full p-4">
                  <div className="flex items-center w-full min-w-0 mb-8 bg-white/10 border-2 border-white/10 rounded-lg h-12 px-5 py-8 ">
                    <CiMobile1 size={25} color="#fff" className="mr-3" />
                    <input
                      type="tel"
                      className="bg-transparent outline-none border-none text-white placeholder-white/60 w-full min-w-[300px] text-xl font-bold"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      disabled={loading || buttonSuccess || buttonAnimating}
                    />
                  </div>
                </div>
                <div className="otp-animate-wrapper">
                  <button
                    type="button"
                    className={`otp-slide-btn${buttonAnimating ? ' send-animate' : ''}${buttonSuccess ? ' animating' : ''}`}
                    onClick={handleSendOtp}
                    disabled={loading || phone.length !== 10 || buttonSuccess || buttonAnimating}
                    style={{ marginTop: 0 }}
                  >
                    <div className="progress-bar" />
                    <span className="send-icon" style={{display: buttonSuccess ? 'none' : undefined}}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="#fff" className="mr-2"><path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" /></svg>
                      {!buttonAnimating && !buttonSuccess && 'Send OTP'}
                    </span>
                    <span className="tick-icon" style={{display: buttonSuccess ? undefined : 'none'}}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#F3F3F3"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-18-2-36t-6-35l65-65q11 32 17 66t6 70q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-56-216L254-466l56-56 114 114 400-401 56 56-456 457Z"/></svg>
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="form-">
                  <label className="form-label">ENTER OTP</label>
                  <OtpInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                  />
                </div>
                <div className="otp-animate-wrapper">
                  <button
                    type="button"
                    className={`otp-slide-btn${verifyButtonAnimating ? ' animating' : ''}${verifyButtonSuccess ? ' animating' : ''}`}
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6 || verifyButtonSuccess || verifyButtonAnimating}
                  >
                    <span className="send-icon" style={{display: verifyButtonSuccess ? 'none' : undefined}}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#F3F3F3"><path d="M720-240q25 0 42.5-17.5T780-300q0-25-17.5-42.5T720-360q-25 0-42.5 17.5T660-300q0 25 17.5 42.5T720-240Zm0 120q30 0 56-14t43-39q-23-14-48-20.5t-51-6.5q-26 0-51 6.5T621-173q17 25 43 39t56 14ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM490-80H240q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v52q-18-6-37.5-9t-42.5-3v-40H240v400h212q8 24 16 41.5T490-80Zm230 40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM240-560v400-400Z"/></svg>                      Verify OTP
                    </span>
                    <span className="tick-icon" style={{display: verifyButtonSuccess ? undefined : 'none'}}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#F3F3F3"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-18-2-36t-6-35l65-65q11 32 17 66t6 70q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-56-216L254-466l56-56 114 114 400-401 56 56-456 457Z"/></svg>
                    </span>
                  </button>
                </div>

                <div className="resend-otp">
                  <p className="resend-text">
                    Didn't receive the OTP?
                  </p>
                  <button
                    type="button"
                    className="resend-button"
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                  >
                    {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                  </button>
                </div>
                <button
                  type="button"
                  className="back-button"
                  onClick={handleBackToPhone}
                >
                  ← Back to Phone Number
                </button>
              </>
            )}
          </form>
        </div>
        <div className="p-9 text-center text-white text-[18px]">
          <p>© 2023 Fleet Monitoring System | Secure Login</p>
      </div>
      </div>

    </div>
    
  );
};

export default LoginPage;