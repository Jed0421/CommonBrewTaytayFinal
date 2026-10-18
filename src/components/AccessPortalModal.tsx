import React, { useState, useEffect } from 'react';
import { Coffee, ArrowLeft, Star, X, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { User as UserType, Customer } from '../types';
import { LegalDocumentsModal } from './LegalDocumentsModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCustomerLoginSuccess: (customer: Customer, token?: string) => void;
  onStaffLoginSuccess: (user: UserType, token?: string) => void;
  initialView?: 'login' | 'register' | 'forgot-password' | 'selector' | 'customer-login' | 'customer-register' | 'staff-login';
}

export const AccessPortalModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCustomerLoginSuccess,
  onStaffLoginSuccess,
  initialView = 'login',
}) => {
  const getInitialView = (v?: string): 'login' | 'register' | 'forgot-password' => {
    if (v === 'register' || v === 'customer-register') return 'register';
    if (v === 'forgot-password') return 'forgot-password';
    return 'login';
  };

  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>(() => getInitialView(initialView));

  // Unified Sign In State (works for Customer, Staff, Cashier, and Admin)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Customer Register State (Only customers register here; staff accounts are created in Admin Module)
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Password visibility for forgot-password
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  // Email OTP State
  const [regOtp, setRegOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Email Duplication Real-Time Check States for Customer Registration
  const [regEmailError, setRegEmailError] = useState('');
  const [checkingRegEmail, setCheckingRegEmail] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);
  const [forgotOtpLoading, setForgotOtpLoading] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(0);

  // Status message
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | null>(null);

  // Synchronize view on open/initialView changes
  useEffect(() => {
    if (isOpen) {
      setView(getInitialView(initialView));
      resetMessages();
      setRegEmailError('');
      setCheckingRegEmail(false);
    }
  }, [isOpen, initialView]);

  // Debounced check for customer email duplication in Database & in-memory store
  useEffect(() => {
    const clean = regEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@') || clean.length < 5) {
      setRegEmailError('');
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingRegEmail(true);
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (data.exists) {
          setRegEmailError('Email is already used');
        } else {
          setRegEmailError('');
        }
      } catch (err) {
        console.error('Failed to check customer email:', err);
      } finally {
        setCheckingRegEmail(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [regEmail]);

  // Countdown timer for email registration OTP
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Countdown timer for forgot password OTP
  useEffect(() => {
    let timer: any;
    if (forgotCountdown > 0) {
      timer = setInterval(() => {
        setForgotCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotCountdown]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // =========================================================================
  // UNIFIED SIGN IN HANDLER
  // Automatically detects user role (Admin, Cashier/Staff, or Customer)
  // =========================================================================
  const handleUnifiedLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch('/api/auth/unified-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        setErrorMsg((data && data.message) || 'Invalid username/email or password.');
        setLoading(false);
        return;
      }

      if (data.accountType === 'staff') {
        // Staff or Admin User detected in database
        if (data.token) {
          localStorage.setItem('commonbrew_staff_token', data.token);
        }
        const roleLabel = data.user?.role || data.role || 'Staff';
        const displayName = data.user?.fullName || data.user?.username || loginIdentifier.trim();
        setSuccessMsg(`Welcome back, ${displayName}! Loading ${roleLabel === 'Cashier' ? 'POS Terminal' : 'Admin Portal'}...`);

        // Promptly transition into staff view without getting stuck
        setTimeout(() => {
          setLoading(false);
          onStaffLoginSuccess(data.user, data.token);
          onClose();
        }, 150);
      } else {
        // Customer User detected in database
        if (data.token) {
          localStorage.setItem('commonbrew_customer_token', data.token);
        }
        localStorage.setItem('commonbrew_customer', JSON.stringify(data.customer));
        setSuccessMsg(`Welcome back, ${data.customer.fullName}!`);

        setTimeout(() => {
          setLoading(false);
          onCustomerLoginSuccess(data.customer, data.token);
          onClose();
        }, 150);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        setErrorMsg('Sign in request timed out. Please check your connection and try again.');
      } else {
        setErrorMsg('Failed to connect to authentication server. Please check your connection.');
      }
      setLoading(false);
    }
  };

  // =========================================================================
  // CUSTOMER REGISTRATION HANDLERS (Only customers register here)
  // =========================================================================
  const handleSendEmailCode = async () => {
    if (!regEmail || !regEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address first.');
      return;
    }
    if (regEmailError) {
      setErrorMsg('Email is already used');
      return;
    }
    resetMessages();
    setOtpLoading(true);

    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to send verification code.');
        if (data.message === 'Email is already used') {
          setRegEmailError('Email is already used');
        }
      } else {
        setOtpSent(true);
        setOtpCountdown(60);
        setSuccessMsg(data.message || `Verification code sent to ${regEmail}!`);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to email verification service.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!regOtp || regOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    resetMessages();
    setOtpLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, otp: regOtp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Invalid verification code.');
      } else {
        setOtpVerified(true);
        setSuccessMsg('Email successfully verified! ✓ You can now complete registration.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to verification service.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCustomerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (regEmailError) {
      setErrorMsg('Email is already used');
      return;
    }

    if (!otpVerified) {
      setErrorMsg('Please verify your email with the 6-digit code before completing registration.');
      return;
    }

    setLoading(true);

    try {
      const trimmedAddress = regAddress.trim();
      const res = await fetch('/api/auth/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          username: regUsername.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          address: trimmedAddress,
          defaultAddress: trimmedAddress,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Registration failed.');
        setLoading(false);
        return;
      }
      if (trimmedAddress) {
        localStorage.setItem('commonbrew_reg_address', trimmedAddress);
      }
      if (data.token) {
        localStorage.setItem('commonbrew_customer_token', data.token);
      }
      if (data.customer) {
        localStorage.setItem('commonbrew_customer', JSON.stringify(data.customer));
      }
      setSuccessMsg('Customer account created! 50 bonus points claimed 🎉');
      setTimeout(() => {
        onCustomerLoginSuccess(data.customer, data.token);
        onClose();
      }, 600);
    } catch (err) {
      setErrorMsg('Failed to connect to registration service.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // FORGOT PASSWORD HANDLERS
  // =========================================================================
  const handleSendForgotPasswordCode = async () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    resetMessages();
    setForgotOtpLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password-send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to send reset code.');
      } else {
        setForgotOtpSent(true);
        setForgotCountdown(60);
        setSuccessMsg(data.message || `Verification code sent to ${forgotEmail}!`);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to verification service.');
    } finally {
      setForgotOtpLoading(false);
    }
  };

  const handleVerifyForgotPasswordCode = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    resetMessages();
    setForgotOtpLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Invalid verification code.');
      } else {
        setForgotOtpVerified(true);
        setSuccessMsg('Email verified successfully! You can now set a new password.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to verification service.');
    } finally {
      setForgotOtpLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!forgotOtpVerified) {
      setErrorMsg('Please verify your email address before resetting password.');
      return;
    }

    if (forgotNewPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to reset password.');
      } else {
        setSuccessMsg(data.message || 'Password reset successfully! Redirecting to sign in...');
        setTimeout(() => {
          setView('login');
          setLoginIdentifier(forgotEmail);
          resetMessages();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'radial-gradient(circle at top right, rgba(249, 115, 22, 0.08), transparent 45%), #ffffff',
          borderRadius: '24px',
          borderTop: '4px solid #ea580c',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 20px -5px rgba(0,0,0,0.1)',
          padding: '2rem',
          position: 'relative',
          margin: 'auto',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#6b7280',
            transition: 'background 0.2s',
          }}
        >
          <X size={18} />
        </button>

        {/* COMMONBREW Branding Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              background: '#ea580c',
              color: '#ffffff',
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)',
            }}
          >
            <Coffee size={20} />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: '1.1rem',
              color: '#ea580c',
              letterSpacing: '0.04em',
            }}
          >
            COMMONBREW
          </span>
        </div>

        {/* Global Error & Success Alerts */}
        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.825rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #6ee7b7',
              color: '#065f46',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.825rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: UNIFIED SIGN IN (The only login page)
            Detects Admin, Staff/Cashier, or Customer directly from database
           ========================================================================= */}
        {view === 'login' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem' }}>
              Welcome back
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1.5rem', lineHeight: 1.4 }}>
              Sign in to track orders, earn loyalty rewards, or access staff portal.
            </p>

            <form onSubmit={handleUnifiedLoginSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#6b7280',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: '0.4rem',
                  }}
                >
                  USERNAME OR EMAIL
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. juan.delacruz or juan@gmail.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '2px solid #9ca3af',
                    background: '#fafafa',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#6b7280',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: '0.4rem',
                  }}
                >
                  PASSWORD
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.85rem 0.75rem 0.9rem',
                      borderRadius: '12px',
                      border: '2px solid #9ca3af',
                      background: '#fafafa',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: '#111827',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '6px',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={{ textAlign: 'right', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      if (loginIdentifier && loginIdentifier.includes('@')) {
                        setForgotEmail(loginIdentifier);
                      }
                      setView('forgot-password');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: '#ea580c',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  opacity: loading ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>Don't have an account?</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
            </div>

            <button
              type="button"
              onClick={() => {
                resetMessages();
                setView('register');
              }}
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#111827',
                border: '1.5px solid #e5e7eb',
                padding: '0.8rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s',
              }}
            >
              <span>Register — earn 50 bonus points 🎉</span>
            </button>

            {/* Terms Footnote */}
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', marginTop: '1.25rem', marginBottom: 0, lineHeight: 1.4 }}>
              By signing in you agree to CommonBrew's Terms of Service and Privacy Policy.
            </p>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: CUSTOMER REGISTRATION ONLY
            (Staff & Admin accounts are created exclusively by Admin in Admin Module)
           ========================================================================= */}
        {view === 'register' && (
          <div>
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setView('login');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginBottom: '1.25rem',
                padding: 0,
              }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>

            {/* Loyalty Alert Banner */}
            <div
              style={{
                background: '#fff4ed',
                border: '1.5px solid #ffcca8',
                borderRadius: '12px',
                padding: '0.8rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                marginBottom: '1rem',
              }}
            >
              <Star size={18} color="#ea580c" style={{ flexShrink: 0 }} />
              <span style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.825rem' }}>
                Register now and receive 50 Welcome Loyalty Points!
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 0.4rem' }}>
              Create customer account
            </h2>

            {/* Notice clarifying that Staff/Admin accounts are created in Admin Module */}
            <div
              style={{
                fontSize: '0.78rem',
                color: '#4b5563',
                background: '#f9fafb',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.45rem',
                lineHeight: 1.35,
              }}
            >
              <ShieldCheck size={16} color="#6b7280" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Customer Registration:</strong> This form creates customer ordering accounts. Staff and Admin accounts are provisioned by the store administrator in the <em>Admin Module</em>.
              </span>
            </div>

            <form onSubmit={handleCustomerRegisterSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#6b7280',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Maria Dela Santos"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '2px solid #9ca3af',
                    background: '#fafafa',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#6b7280',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  USERNAME *
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. mariadelasantos"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '2px solid #9ca3af',
                    background: '#fafafa',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      color: regEmailError ? '#dc2626' : '#6b7280',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    GMAIL / EMAIL ADDRESS *
                  </label>
                  {otpVerified && !regEmailError && (
                    <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Email Verified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="email"
                    required
                    disabled={otpVerified}
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (otpVerified) setOtpVerified(false);
                    }}
                    placeholder="maria@gmail.com"
                    style={{
                      flex: '1 1 0%',
                      minWidth: 0,
                      padding: '0.75rem 0.9rem',
                      borderRadius: '12px',
                      border: regEmailError ? '2px solid #dc2626' : (otpVerified ? '2px solid #10b981' : '2px solid #9ca3af'),
                      background: regEmailError ? '#fef2f2' : (otpVerified ? '#f0fdf4' : '#fafafa'),
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#111827',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSendEmailCode}
                    disabled={otpLoading || otpCountdown > 0 || otpVerified || !!regEmailError || checkingRegEmail || !regEmail.includes('@')}
                    style={{
                      flexShrink: 0,
                      background: otpVerified ? '#10b981' : (regEmailError ? '#f3f4f6' : '#fff4ed'),
                      border: otpVerified ? '2px solid #10b981' : (regEmailError ? '2px solid #e5e7eb' : '2px solid #ea580c'),
                      color: otpVerified ? '#ffffff' : (regEmailError ? '#9ca3af' : '#ea580c'),
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: (otpLoading || otpCountdown > 0 || otpVerified || !!regEmailError || checkingRegEmail || !regEmail.includes('@')) ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      opacity: (otpLoading || otpCountdown > 0 || !!regEmailError || !regEmail.includes('@')) ? 0.75 : 1,
                    }}
                  >
                    {otpVerified ? 'Verified ✓' : otpCountdown > 0 ? `Resend (${otpCountdown}s)` : otpLoading ? 'Sending...' : 'Send Code'}
                  </button>
                </div>

                {/* Catch: Email is already used */}
                {regEmailError ? (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '0.8rem' }}></i>
                    <span>{regEmailError}</span>
                  </div>
                ) : checkingRegEmail ? (
                  <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={11} className="animate-spin" /> Checking database...
                  </div>
                ) : null}
              </div>

              {/* 6-Digit Email Verification Code Input */}
              {otpSent && !otpVerified && (
                <div style={{ marginBottom: '1rem', background: '#fffcf7', padding: '0.9rem 1rem', borderRadius: '14px', border: '2px solid #ea580c', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                    ENTER 6-DIGIT VERIFICATION CODE *
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      maxLength={6}
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      style={{
                        flex: '1 1 0%',
                        minWidth: 0,
                        padding: '0.75rem 0.6rem',
                        borderRadius: '12px',
                        border: '2px solid #9ca3af',
                        background: '#ffffff',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        letterSpacing: '0.2em',
                        textAlign: 'center',
                        outline: 'none',
                        color: '#111827',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmailCode}
                      disabled={otpLoading || regOtp.length !== 6}
                      style={{
                        flexShrink: 0,
                        background: regOtp.length === 6 ? '#ea580c' : '#9ca3af',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: regOtp.length === 6 ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {otpLoading ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#6b7280',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  MOBILE NUMBER
                </label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+63 912 345 6789"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '2px solid #9ca3af',
                    background: '#fafafa',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.725rem', color: '#9ca3af', display: 'block', marginTop: '0.25rem' }}>
                  For order tracking and delivery updates
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#6b7280',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  DEFAULT DELIVERY ADDRESS
                </label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Unit / House No., Street, Barangay, City"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '2px solid #9ca3af',
                    background: '#fafafa',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#6b7280',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  PASSWORD *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.85rem 0.75rem 0.9rem',
                      borderRadius: '12px',
                      border: '2px solid #9ca3af',
                      background: '#fafafa',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    title={showRegPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '6px',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Terms & Conditions and Privacy Policy agreement */}
              <div style={{ fontSize: '0.74rem', color: '#6b7280', textAlign: 'center', marginBottom: '0.85rem', lineHeight: 1.45 }}>
                By creating an account, you agree to CommonBrew's{' '}
                <button
                  type="button"
                  onClick={() => setLegalModalTab('terms')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#ea580c', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
                >
                  Terms and Conditions
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => setLegalModalTab('privacy')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#ea580c', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
                >
                  Privacy Policy
                </button>.
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Creating Account...' : 'Register & Claim 50 Points'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setView('login');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Already have an account? <span style={{ color: '#ea580c', fontWeight: 800 }}>Sign In</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: FORGOT PASSWORD (EMAIL OTP VERIFIED)
           ========================================================================= */}
        {view === 'forgot-password' && (
          <div>
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setView('login');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginBottom: '1.25rem',
                padding: 0,
              }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem' }}>
              Reset Password
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1.5rem', lineHeight: 1.4 }}>
              Enter your registered email address to receive a 6-digit verification code.
            </p>

            <form onSubmit={handleResetPasswordSubmit}>
              {/* Step 1: Email Input & Send Code */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      color: '#6b7280',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    REGISTERED EMAIL ADDRESS *
                  </label>
                  {forgotOtpVerified && (
                    <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Email Verified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="email"
                    required
                    disabled={forgotOtpVerified}
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotOtpVerified) setForgotOtpVerified(false);
                    }}
                    placeholder="e.g. juan@gmail.com"
                    style={{
                      flex: '1 1 0%',
                      minWidth: 0,
                      padding: '0.75rem 0.9rem',
                      borderRadius: '12px',
                      border: forgotOtpVerified ? '2px solid #10b981' : '2px solid #9ca3af',
                      background: forgotOtpVerified ? '#f0fdf4' : '#fafafa',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: '#111827',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSendForgotPasswordCode}
                    disabled={forgotOtpLoading || forgotCountdown > 0 || forgotOtpVerified}
                    style={{
                      flexShrink: 0,
                      background: forgotOtpVerified ? '#10b981' : '#fff4ed',
                      border: forgotOtpVerified ? '2px solid #10b981' : '2px solid #ea580c',
                      color: forgotOtpVerified ? '#ffffff' : '#ea580c',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: (forgotOtpLoading || forgotCountdown > 0 || forgotOtpVerified) ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      opacity: (forgotOtpLoading || forgotCountdown > 0) ? 0.75 : 1,
                    }}
                  >
                    {forgotOtpVerified ? 'Verified ✓' : forgotCountdown > 0 ? `Resend (${forgotCountdown}s)` : forgotOtpLoading ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </div>

              {/* Step 2: Enter 6-Digit Code */}
              {forgotOtpSent && !forgotOtpVerified && (
                <div style={{ marginBottom: '1rem', background: '#fffcf7', padding: '0.9rem 1rem', borderRadius: '14px', border: '2px solid #ea580c', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                    ENTER 6-DIGIT VERIFICATION CODE *
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      style={{
                        flex: '1 1 0%',
                        minWidth: 0,
                        padding: '0.75rem 0.6rem',
                        borderRadius: '12px',
                        border: '2px solid #9ca3af',
                        background: '#ffffff',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        letterSpacing: '0.2em',
                        textAlign: 'center',
                        outline: 'none',
                        color: '#111827',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyForgotPasswordCode}
                      disabled={forgotOtpLoading || forgotOtp.length !== 6}
                      style={{
                        flexShrink: 0,
                        background: forgotOtp.length === 6 ? '#ea580c' : '#9ca3af',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: forgotOtp.length === 6 ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {forgotOtpLoading ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Set New Password */}
              {forgotOtpVerified && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        color: '#6b7280',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        marginBottom: '0.4rem',
                      }}
                    >
                      NEW PASSWORD *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        style={{
                          width: '100%',
                          padding: '0.75rem 2.85rem 0.75rem 0.9rem',
                          borderRadius: '12px',
                          border: '2px solid #9ca3af',
                          background: '#fafafa',
                          fontSize: '0.9rem',
                          outline: 'none',
                          color: '#111827',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        aria-label={showForgotNewPassword ? 'Hide password' : 'Show password'}
                        title={showForgotNewPassword ? 'Hide password' : 'Show password'}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          borderRadius: '6px',
                        }}
                      >
                        {showForgotNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        color: '#6b7280',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        marginBottom: '0.4rem',
                      }}
                    >
                      CONFIRM NEW PASSWORD *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        style={{
                          width: '100%',
                          padding: '0.75rem 2.85rem 0.75rem 0.9rem',
                          borderRadius: '12px',
                          border: '2px solid #9ca3af',
                          background: '#fafafa',
                          fontSize: '0.9rem',
                          outline: 'none',
                          color: '#111827',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        aria-label={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                        title={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          borderRadius: '6px',
                        }}
                      >
                        {showForgotConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      background: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'Resetting Password...' : 'Update Password & Sign In'}
                  </button>
                </>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Legal Documents Modal */}
      <LegalDocumentsModal
        isOpen={Boolean(legalModalTab)}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'terms'}
      />
    </div>
  );
};
