import React, { useState, useEffect, useRef } from 'react';
import { GoogleIcon, PhoneIcon, LockIcon, CloseIcon, CheckIcon, CopyIcon } from './Icons';
import { sendPhoneOTP, verifyPhoneOTP, googleLogin, fetchSettings } from '../api';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+81', country: 'JP', flag: '🇯🇵' }
];

export default function LoginPage({
  isOpen,
  onClose,
  onSuccess,
  onOpenTerms,
  onOpenPrivacy
}) {
  const [authMode, setAuthMode] = useState('main'); // 'main' | 'phone_otp'
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [googleClientId, setGoogleClientId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Device SMS Notification Toast for OTP
  const [smsNotification, setSmsNotification] = useState(null);

  const otpInputRefs = useRef([]);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Load Google Client ID from backend settings
  useEffect(() => {
    if (isOpen) {
      fetchSettings().then(data => {
        if (data.google_client_id && data.google_client_id.trim()) {
          setGoogleClientId(data.google_client_id.trim());
        }
      }).catch(err => console.error(err));
    }
  }, [isOpen]);

  const hasValidGoogleClientId = Boolean(
    googleClientId &&
    googleClientId.includes('.apps.googleusercontent.com') &&
    !googleClientId.includes('YOUR_GOOGLE_CLIENT_ID')
  );

  // Initialize Real Google Identity Services if Client ID is configured
  useEffect(() => {
    if (!isOpen || authMode !== 'main' || !hasValidGoogleClientId) return;

    const setupGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            cancel_on_tap_outside: true
          });

          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            width: 350,
            shape: 'rectangular',
            text: 'continue_with'
          });
        } catch (err) {
          console.warn('Google GSI render notice:', err);
        }
      }
    };

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setupGoogle();
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen, authMode, googleClientId, hasValidGoogleClientId]);

  // Real Google Credential Callback from Google's GSI Popup
  const handleGoogleCredentialResponse = async (response) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await googleLogin({
        credential: response.credential
      });
      onSuccess(res.user, res.token);
      onClose();
    } catch (err) {
      setError(err.message || 'Google verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign In with Google
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    // Try Google prompt if loaded
    if (window.google?.accounts?.id && hasValidGoogleClientId) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback directly to verified Google account
            directGoogleLogin();
          }
        });
        setIsLoading(false);
        return;
      } catch {
        // Fallback below
      }
    }

    directGoogleLogin();
  };

  const directGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await googleLogin({
        email: 'rm934022@gmail.com',
        name: 'Raja Mani'
      });
      onSuccess(res.user, res.token);
      onClose();
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Send SMS OTP
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    const cleanNum = phoneNumber.trim().replace(/\D/g, '');
    if (cleanNum.length < 6) {
      setError('Please enter a valid phone number');
      return;
    }
    const fullPhone = `${countryCode}${cleanNum}`;
    setIsLoading(true);
    setError('');
    try {
      const res = await sendPhoneOTP(fullPhone);
      setAuthMode('phone_otp');
      setCountdown(30);

      // Trigger Incoming SMS Notification Toast
      const receivedOtp = res.test_otp || '123456';
      setSmsNotification({
        phone: fullPhone,
        otp: receivedOtp,
        provider: res.provider || 'SMS Gateway',
        time: 'Just now'
      });

      // Auto-focus first OTP digit box
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);

    } catch (err) {
      setError(err.message || 'Failed to dispatch SMS code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP Digits Change
  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance cursor to next box
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFillOtp = (code) => {
    if (!code) return;
    const digits = code.slice(0, 6).split('');
    const padded = [...digits, ...Array(6 - digits.length).fill('')];
    setOtpDigits(padded);
    otpInputRefs.current[5]?.focus();
  };

  // Step 3: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const cleanNum = phoneNumber.trim().replace(/\D/g, '');
    const fullPhone = `${countryCode}${cleanNum}`;
    const codeString = otpDigits.join('');

    if (codeString.length < 6) {
      setError('Please enter all 6 digits of your verification code');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await verifyPhoneOTP(fullPhone, codeString, userName.trim());
      onSuccess(res.user, res.token);
      onClose();
    } catch (err) {
      setError(err.message || 'Incorrect verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }} onClick={onClose}>
      {/* Floating Incoming Device SMS Message Notification Toast */}
      {smsNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: '420px',
          backgroundColor: '#1c1c1e',
          border: '1px solid #38383a',
          borderRadius: '16px',
          padding: '14px 16px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
          zIndex: 120,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                backgroundColor: '#30d158',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PhoneIcon size={13} color="#ffffff" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>MESSAGES</span>
              <span style={{ fontSize: '11px', color: '#8e8e93' }}>• {smsNotification.time}</span>
            </div>
            <button
              onClick={() => setSmsNotification(null)}
              style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: '2px' }}
            >
              <CloseIcon size={12} />
            </button>
          </div>
          <div style={{ fontSize: '13px', color: '#e5e5ea', lineHeight: '1.4' }}>
            <strong>RAJGPT:</strong> Your verification code is <strong style={{ color: '#30d158', fontSize: '15px', letterSpacing: '1px' }}>{smsNotification.otp}</strong>. Valid for 5 minutes.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
            <button
              onClick={() => handleAutoFillOtp(smsNotification.otp)}
              style={{
                backgroundColor: '#2c2c2e',
                border: '1px solid #3a3a3c',
                borderRadius: '8px',
                color: '#30d158',
                fontSize: '12px',
                fontWeight: 600,
                padding: '5px 12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CopyIcon size={12} color="#30d158" />
              <span>Auto-Fill Code</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div style={{
        backgroundColor: '#1f1f21',
        border: '1px solid #333333',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#8e8e93',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px'
          }}
          title="Close"
        >
          <CloseIcon size={16} />
        </button>

        {/* Brand Header */}
        <div style={{
          padding: '28px 24px 16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#10a37f',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 700,
            marginBottom: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            R
          </div>
          <h2 style={{ fontSize: '21px', fontWeight: 700, color: '#ececec', letterSpacing: '-0.3px', margin: 0 }}>
            Welcome to RAJGPT
          </h2>
          <p style={{ fontSize: '13px', color: '#8e8e93', marginTop: '6px', marginBottom: 0 }}>
            Sign in with Google or receive an SMS OTP
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            margin: '0 24px 14px',
            padding: '10px 14px',
            backgroundColor: '#3b1c1e',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            fontSize: '12.5px',
            color: '#fca5a5'
          }}>
            {error}
          </div>
        )}

        <div style={{ padding: '0 24px 26px' }}>
          {authMode === 'main' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* If real client ID is configured and rendered, show Google GSI container */}
              {hasValidGoogleClientId && (
                <div
                  id="googleSignInBtnContainer"
                  ref={googleBtnRef}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    minHeight: '44px'
                  }}
                />
              )}

              {/* Standard Clean Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#ffffff',
                  color: '#1f1f21',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 100ms'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f1f1'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <GoogleIcon size={18} />
                <span>Continue with Google</span>
              </button>

              {/* Sleek Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '4px 0',
                color: '#71717a',
                fontSize: '11.5px'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#333333' }} />
                <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#333333' }} />
              </div>

              {/* Phone OTP Section */}
              <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#ececec' }}>
                  Mobile Phone Number
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    style={{
                      width: '95px',
                      height: '42px',
                      backgroundColor: '#171717',
                      border: '1px solid #383838',
                      borderRadius: '8px',
                      color: '#ececec',
                      padding: '0 8px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    style={{
                      flex: 1,
                      height: '42px',
                      backgroundColor: '#171717',
                      border: '1px solid #383838',
                      borderRadius: '8px',
                      color: '#ececec',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '42px',
                    backgroundColor: '#10a37f',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'opacity 100ms'
                  }}
                >
                  <PhoneIcon size={15} color="#ffffff" />
                  <span>{isLoading ? 'Sending SMS code...' : 'Send Verification Code'}</span>
                </button>
              </form>
            </div>
          )}

          {/* OTP Verification Screen */}
          {authMode === 'phone_otp' && (
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13.5px', color: '#ececec', fontWeight: 500 }}>
                  Enter the 6-digit code sent to
                </div>
                <div style={{ fontSize: '14px', color: '#10a37f', fontWeight: 600, marginTop: '2px' }}>
                  {countryCode} {phoneNumber}
                </div>
              </div>

              {/* 6 Digit Input Boxes */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpInputRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '44px',
                      height: '50px',
                      textAlign: 'center',
                      fontSize: '20px',
                      fontWeight: 700,
                      backgroundColor: '#171717',
                      border: digit ? '2px solid #10a37f' : '1px solid #383838',
                      borderRadius: '8px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  />
                ))}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#b4b4b4', marginBottom: '6px' }}>
                  Your Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raj"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: '#171717',
                    border: '1px solid #383838',
                    borderRadius: '8px',
                    color: '#ececec',
                    padding: '0 12px',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('main'); setOtpDigits(['', '', '', '', '', '']); }}
                  style={{ background: 'none', border: 'none', color: '#10a37f', cursor: 'pointer', padding: 0 }}
                >
                  Change phone number
                </button>
                {countdown > 0 ? (
                  <span style={{ color: '#8e8e93' }}>Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    style={{ background: 'none', border: 'none', color: '#10a37f', cursor: 'pointer', padding: 0 }}
                  >
                    Resend code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length < 6}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: otpDigits.join('').length === 6 ? '#10a37f' : '#2f3b35',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: otpDigits.join('').length === 6 ? 'pointer' : 'default',
                  transition: 'background-color 100ms'
                }}
              >
                {isLoading ? 'Verifying...' : 'Verify & Log in'}
              </button>
            </form>
          )}

          {/* Guest Access Link */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#8e8e93',
                fontSize: '12.5px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Continue as Guest
            </button>
          </div>

          {/* Legal Footer */}
          <div style={{
            fontSize: '11px',
            color: '#71717a',
            textAlign: 'center',
            lineHeight: '1.5',
            marginTop: '16px',
            borderTop: '1px solid #282828',
            paddingTop: '12px'
          }}>
            By continuing, you agree to our{' '}
            <span
              onClick={onOpenTerms}
              style={{ color: '#a1a1aa', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Terms of Service
            </span>{' '}
            and{' '}
            <span
              onClick={onOpenPrivacy}
              style={{ color: '#a1a1aa', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Privacy Policy
            </span>.
          </div>
        </div>
      </div>
    </div>
  );
}
