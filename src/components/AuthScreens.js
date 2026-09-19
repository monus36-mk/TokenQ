'use client';

import React, { useState } from 'react';

export default function AuthScreens({ onLoginSuccess, onClose }) {
  const [stage, setStage] = useState('email'); // 'email', 'password', 'signup', 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('F');
  const [city, setCity] = useState('Thanjavur');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [isOtpFallback, setIsOtpFallback] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Stage 1: Check Email
  const handleCheckEmail = async (e) => {
    if (e) e.preventDefault();
    const emailTrimmed = email.trim().toLowerCase();
    const isGmail = emailTrimmed.endsWith('@gmail.com') || emailTrimmed === 'admin@gmail.com';

    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailTrimmed) || !isGmail) {
      setError('Please enter a valid Gmail address (ending in @gmail.com)');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const emailLower = email.trim().toLowerCase();

    // Frontend bypass for super-admins
    if (emailLower === 'rare36monus@gmail.com' || emailLower === 'admin@gmail.com') {
      setIsSubmitting(false);
      setStage('password');
      return;
    }

    try {
      const res = await fetch(`/api/auth?email=${encodeURIComponent(emailLower)}`);
      const json = await res.json();

      if (json.success) {
        if (json.exists) {
          // User exists (Admin, Clinic-Admin, or Patient). Go to Password entry.
          setStage('password');
        } else {
          // User does not exist. Go to Signup registration form.
          setStage('signup');
        }
      } else {
        setError(json.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Please check if your server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage 2: Login (verify password for Admin or Patient)
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const json = await response.json();
      if (json.success) {
        onLoginSuccess(json.user);
      } else {
        setError(json.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Error verifying credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage 3: Send verification OTP to email and go to stage 'otp'
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      setError('Please enter your name');
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!age || Number(age) <= 0 || Number(age) > 115) {
      setError('Please enter a valid age');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    setError('');
    setIsSubmitting(true);
    setIsOtpFallback(false);

    // Generate a random 4-digit code
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    setSentOtp(generatedCode);
    setEnteredOtp('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: generatedCode
        })
      });
      const json = await response.json();
      if (json.success) {
        if (json.message && json.message.includes('logged to server console')) {
          // If SMTP not configured, fallback to showing code on screen
          setIsOtpFallback(true);
        }
        setStage('otp');
      } else {
        console.warn('Failed to send OTP email:', json.error);
        setIsOtpFallback(true);
        setStage('otp');
      }
    } catch (err) {
      console.warn('Error sending OTP email, falling back to testing code:', err);
      setIsOtpFallback(true);
      setStage('otp');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage 3: Create account directly and log in
  const handleDirectRegister = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      setError('Please enter your name');
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!age || Number(age) <= 0 || Number(age) > 115) {
      setError('Please enter a valid age');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const formattedPhone = '+91 ' + digitsOnly.slice(0, 5) + ' ' + digitsOnly.slice(5);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          phone: formattedPhone,
          age: Number(age),
          gender,
          city: city.trim()
        })
      });
      const json = await response.json();
      if (json.success) {
        onLoginSuccess(json.user);
      } else {
        setError(json.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage 4: Verify OTP and complete Registration
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    if (enteredOtp !== sentOtp) {
      setError('Invalid verification code. Please try again.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const digitsOnly = phone.replace(/\D/g, '');
    const formattedPhone = '+91 ' + digitsOnly.slice(0, 5) + ' ' + digitsOnly.slice(5);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          phone: formattedPhone,
          age: Number(age),
          gender,
          city: city.trim()
        })
      });
      const json = await response.json();
      if (json.success) {
        onLoginSuccess(json.user);
      } else {
        setError(json.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password Reset Handlers
  const handleInitiateForgotPassword = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setIsOtpFallback(false);
    setEnteredOtp('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          action: 'send-otp'
        })
      });
      const json = await response.json();
      if (json.success) {
        if (json.fallbackOtp) {
          setIsOtpFallback(true);
          setSentOtp(json.fallbackOtp);
        }
        setStage('forgot-otp');
      } else {
        setError(json.error || 'Failed to send reset code');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyResetOtp = (e) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.length < 4) {
      setError('Please enter the 4-digit code');
      return;
    }
    setError('');
    setStage('reset-password');
  };

  const handleCompletePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: enteredOtp,
          newPassword,
          action: 'reset-password'
        })
      });
      const json = await response.json();
      if (json.success) {
        onLoginSuccess(json.user);
      } else {
        setError(json.error || 'Password reset failed');
      }
    } catch (err) {
      console.error(err);
      setError('Error resetting password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStageBack = () => {
    setError('');
    if (stage === 'password' || stage === 'signup') {
      setStage('email');
      setPassword('');
    } else if (stage === 'otp') {
      setStage('signup');
    } else if (stage === 'forgot-otp') {
      setStage('password');
    } else if (stage === 'reset-password') {
      setStage('forgot-otp');
    } else if (stage === 'email' && onClose) {
      onClose();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '92vh', overflow: 'hidden', position: 'relative', background: 'var(--surface)' }}>
      
      {/* Top Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        zIndex: 10
      }}>
        {stage !== 'email' ? (
          <button 
            type="button"
            onClick={handleStageBack}
            style={{
              background: 'var(--surface2)',
              border: '1.5px solid var(--border2)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '15px',
              color: 'var(--text)',
              transition: 'all 0.15s'
            }}
            title="Go back"
          >
            ←
          </button>
        ) : (
          <div style={{ width: '34px' }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '19px', color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Token<span style={{ color: 'var(--green)' }}>Q</span>
          </div>
        </div>

        {onClose ? (
          <button 
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--surface2)',
              border: '1.5px solid var(--border2)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text2)',
              transition: 'all 0.15s'
            }}
            title="Close"
          >
            ✕
          </button>
        ) : (
          <div style={{ width: '34px' }} />
        )}
      </div>

      <div className="scrollable" style={{ padding: '20px 24px 36px', flex: 1, overflowY: 'auto' }}>
        
        {/* STAGE 1: EMAIL ADDRESS INPUT */}
        {stage === 'email' && (
          <form onSubmit={handleCheckEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginTop: '4px', marginBottom: '4px' }}>
              Welcome! Let's get started
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', textAlign: 'center', marginTop: '-8px', marginBottom: '8px' }}>
              Enter your email to log in or create your profile
            </div>

            {error && (
              <div style={{ color: 'var(--red)', background: 'var(--red-light)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(163, 45, 45, 0.15)' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="fg">
              <label className="fl">Enter Gmail Address</label>
              <input
                type="email"
                className="fi-input"
                placeholder="e.g. yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn-p" disabled={isSubmitting} style={{ marginTop: '8px' }}>
              {isSubmitting ? 'Checking email...' : 'Continue →'}
            </button>
          </form>
        )}

        {/* STAGE 2: PASSWORD ENTRY (LOGIN) */}
        {stage === 'password' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4px', marginTop: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                Enter Password
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                Verifying <strong style={{ color: 'var(--text)' }}>{email}</strong>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--red)', background: 'var(--red-light)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(163, 45, 45, 0.15)' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="fg">
              <label className="fl" style={{ textAlign: 'center' }}>Password</label>
              <input
                type="password"
                className="fi-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ textAlign: 'center', fontSize: '18px', fontWeight: 600 }}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
              <button
                type="button"
                onClick={handleInitiateForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--green)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0'
                }}
                disabled={isSubmitting}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="btn-p" disabled={isSubmitting} style={{ marginTop: '4px' }}>
              {isSubmitting ? 'Verifying Password...' : 'Log In ✓'}
            </button>

            <button
              type="button"
              className="btn-s"
              onClick={handleStageBack}
              style={{ width: '100%', marginTop: '4px', padding: '11px 16px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              ← Back to Email
            </button>
          </form>
        )}

        {/* STAGE 3: PATIENT SIGNUP DETAILS */}
        {stage === 'signup' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center', marginBottom: '6px', marginTop: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                Create Patient Profile
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                Setup booking profile for <strong style={{ color: 'var(--text)' }}>{email}</strong>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--red)', background: 'var(--red-light)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(163, 45, 45, 0.15)' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="fg">
              <label className="fl">Full Name</label>
              <input
                type="text"
                className="fi-input"
                placeholder="e.g. Kavitha Rajan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="fg">
              <label className="fl">Mobile Number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '60px', padding: '11px 0', border: '1.5px solid var(--border2)', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', textAlign: 'center', fontSize: '14px', color: 'var(--text2)', fontWeight: 600 }}>
                  +91
                </div>
                <input
                  type="text"
                  className="fi-input"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  style={{ flex: 1 }}
                  required
                />
              </div>
            </div>

            <div className="frow" style={{ display: 'flex', gap: '10px' }}>
              <div className="fg" style={{ flex: 1 }}>
                <label className="fl">Age</label>
                <input
                  type="number"
                  className="fi-input"
                  placeholder="34"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              
              <div className="fg" style={{ flex: 1.5 }}>
                <label className="fl">Gender</label>
                <div className="gender-toggle" style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  {['M', 'F', 'O'].map(g => (
                    <div 
                      key={g} 
                      className={`gbtn ${gender === g ? 'sel' : ''}`} 
                      onClick={() => setGender(g)}
                      style={{
                        background: gender === g ? 'var(--text)' : 'var(--surface)',
                        color: gender === g ? 'white' : 'var(--text2)',
                        borderColor: gender === g ? 'var(--text)' : 'var(--border2)',
                        padding: '10px 0',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="fg">
              <label className="fl">City</label>
              <input
                type="text"
                className="fi-input"
                placeholder="Thanjavur"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="fg">
              <label className="fl">Create Password</label>
              <input
                type="password"
                className="fi-input"
                placeholder="Choose a password (min 4 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-p" style={{ marginTop: '6px' }}>
              Send Verification Code 📧
            </button>

            <button
              type="button"
              className="btn-s"
              onClick={handleStageBack}
              style={{ width: '100%', marginTop: '4px', padding: '11px 16px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              ← Back to Email
            </button>
          </form>
        )}

        {/* STAGE 4: EMAIL OTP VERIFICATION */}
        {stage === 'otp' && (
          <form onSubmit={handleVerifyOtpAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '6px', marginTop: '4px' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>📧</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                Verify Your Gmail Address
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '6px', lineHeight: '1.4' }}>
                We sent a 4-digit verification OTP code to:<br/>
                <strong style={{ color: 'var(--green)', fontSize: '14px' }}>{email}</strong>
              </div>
            </div>

            {isOtpFallback && (
              <div style={{ color: '#92400E', background: '#FEF3C7', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid #FCD34D', textAlign: 'center' }}>
                ⚠️ Demo / Testing Mode.<br/>
                Use verification code: <strong style={{ fontSize: '16px', color: 'var(--green-dark)' }}>{sentOtp}</strong>
              </div>
            )}

            {error && (
              <div style={{ color: 'var(--red)', background: 'var(--red-light)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(163, 45, 45, 0.15)' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="fg">
              <label className="fl" style={{ textAlign: 'center', display: 'block' }}>Enter 4-Digit Code</label>
              <input
                type="text"
                className="fi-input"
                placeholder="e.g. 1234"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold', height: '52px' }}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn-p" style={{ marginTop: '6px' }}>
              Confirm Code & Register ✓
            </button>

            <button
              type="button"
              className="btn-s"
              onClick={handleStageBack}
              style={{ width: '100%', marginTop: '4px', padding: '11px 16px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              ← Edit Profile Details
            </button>
          </form>
        )}

        {/* STAGE: FORGOT PASSWORD OTP VERIFICATION */}
        {stage === 'forgot-otp' && (
          <form onSubmit={handleVerifyResetOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '6px', marginTop: '4px' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🔑</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                Reset Your Password
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '6px', lineHeight: '1.4' }}>
                We sent a 4-digit password reset OTP to:<br/>
                <strong style={{ color: 'var(--green)', fontSize: '14px' }}>{email}</strong>
              </div>
            </div>

            {isOtpFallback && (
              <div style={{ color: '#92400E', background: '#FEF3C7', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid #FCD34D', textAlign: 'center' }}>
                ⚠️ Demo / Testing Mode.<br/>
                Use reset code: <strong style={{ fontSize: '16px', color: 'var(--green-dark)' }}>{sentOtp}</strong>
              </div>
            )}

            {error && (
              <div style={{ color: 'var(--red)', background: 'var(--red-light)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(163, 45, 45, 0.15)' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="fg">
              <label className="fl" style={{ textAlign: 'center', display: 'block' }}>Enter 4-Digit Code</label>
              <input
                type="text"
                className="fi-input"
                placeholder="e.g. 1234"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold', height: '52px' }}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn-p" style={{ marginTop: '6px' }} disabled={isSubmitting}>
              Verify Code & Continue →
            </button>

            <button
              type="button"
              className="btn-s"
              onClick={handleStageBack}
              style={{ width: '100%', marginTop: '4px', padding: '11px 16px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              ← Back to Login
            </button>
          </form>
        )}

        {/* STAGE: ENTER NEW PASSWORD */}
        {stage === 'reset-password' && (
          <form onSubmit={handleCompletePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '6px', marginTop: '4px' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🔒</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                Create New Password
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                For account: <strong style={{ color: 'var(--text)' }}>{email}</strong>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--red)', background: 'var(--red-light)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(163, 45, 45, 0.15)' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="fg">
              <label className="fl">New Password</label>
              <input
                type="password"
                className="fi-input"
                placeholder="Choose a new password (min 4 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="fg">
              <label className="fl">Confirm Password</label>
              <input
                type="password"
                className="fi-input"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-p" style={{ marginTop: '6px' }} disabled={isSubmitting}>
              {isSubmitting ? 'Resetting Password...' : 'Reset Password & Log In ✓'}
            </button>

            <button
              type="button"
              className="btn-s"
              onClick={handleStageBack}
              style={{ width: '100%', marginTop: '4px', padding: '11px 16px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              ← Back to Verification Code
            </button>
          </form>
        )}

      </div>
      
    </div>
  );
}
