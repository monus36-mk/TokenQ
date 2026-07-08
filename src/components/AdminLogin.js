import React, { useState } from 'react';

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.toLowerCase() === 'admin' && password === 'admin123') {
      onLoginSuccess();
    } else {
      setError('Invalid admin credentials. Hint: use admin / admin123');
    }
  };

  return (
    <div className="auth-container-card" style={{ margin: '40px auto', maxWidth: '400px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏢</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>Clinic Staff Portal</h2>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
          Enter administrator credentials to manage bookings
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', textAlign: 'center', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px' }}>
            Username
          </label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g. admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px' }}>
            Password
          </label>
          <input 
            type="password" 
            className="input-field" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <button type="submit" className="btn-p" style={{ padding: '14px', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
          🔓 Access Admin Dashboard
        </button>
      </form>
      
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text3)' }}>
        Demo Credentials: <strong>admin</strong> / <strong>admin123</strong>
      </div>
    </div>
  );
}
