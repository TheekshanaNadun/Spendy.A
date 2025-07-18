import React, { useState } from 'react';

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  background: 'rgba(255,255,255,0.97)',
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  padding: 28,
  minWidth: 280,
  maxWidth: 400,
  minHeight: 340,
  margin: '0 auto',
  alignItems: 'center',
  justifyContent: 'center',
};
const labelStyle = {
  fontWeight: 500,
  color: '#6b7280',
  marginBottom: 6,
  fontSize: 15,
  alignSelf: 'flex-start',
};
const inputStyle = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 16,
  outline: 'none',
  transition: 'border 0.2s',
  marginBottom: 2,
  width: '100%',
  maxWidth: 320,
};
const inputFocusStyle = {
  border: '1.5px solid #6366f1',
  boxShadow: '0 0 0 2px #6366f122',
};
const buttonStyle = {
  background: 'linear-gradient(90deg, #6366f1 0%, #2563eb 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 0',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  margin: '24px auto 0 auto',
  transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
  boxShadow: '0 2px 8px rgba(99,102,241,0.10)',
  width: 120,
  outline: 'none',
  display: 'block',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
};
const buttonHoverStyle = {
  background: 'linear-gradient(90deg, #4f46e5 0%, #1d4ed8 100%)',
  boxShadow: '0 6px 18px rgba(99,102,241,0.18)',
  transform: 'translateY(-2px) scale(1.03)',
};
const spinnerStyle = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: 22,
  height: 22,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const messageStyle = {
  marginTop: 10,
  fontSize: 15,
  borderRadius: 6,
  padding: 8,
  textAlign: 'center',
};
const successStyle = {
  ...messageStyle,
  background: '#e0fbe0',
  color: '#15803d',
};
const errorStyle = {
  ...messageStyle,
  background: '#fee2e2',
  color: '#b91c1c',
};
const headerStyle = {
  fontWeight: 700,
  color: '#22223b',
  fontSize: 22,
  letterSpacing: 0.2,
  marginBottom: 18,
  textAlign: 'center',
};

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState('');
  const [isHover, setIsHover] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setOldPassword('');
        setNewPassword('');
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} style={formStyle} autoComplete="off">
      <div style={headerStyle}>Change Password</div>
      <div style={{ width: '100%', maxWidth: 320 }}>
        <label style={labelStyle}>Old Password:</label>
        <input
          type="password"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          style={focusField === 'old' ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
          onFocus={() => setFocusField('old')}
          onBlur={() => setFocusField('')}
          required
        />
      </div>
      <div style={{ width: '100%', maxWidth: 320 }}>
        <label style={labelStyle}>New Password:</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          style={focusField === 'new' ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
          onFocus={() => setFocusField('new')}
          onBlur={() => setFocusField('')}
          required
        />
      </div>
      <button
        type="submit"
        style={isHover ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        disabled={loading}
      >
        {loading ? (
          <span style={spinnerStyle}>
            <svg width="22" height="22" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="22" cy="22" r="18" stroke="#fff" strokeWidth="4" opacity="0.2" />
              <path d="M40 22c0-9.94-8.06-18-18-18" stroke="#fff" strokeWidth="4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 22 22" to="360 22 22" dur="0.8s" repeatCount="indefinite" />
              </path>
            </svg>
          </span>
        ) : (
          'Change'
        )}
      </button>
      {message && <div style={successStyle}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}
    </form>
  );
};

export default ChangePassword; 