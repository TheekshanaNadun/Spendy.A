import React, { useEffect, useState } from 'react';

const cardStyle = {
  background: 'rgba(255,255,255,0.97)',
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  padding: 28,
  minWidth: 280,
  maxWidth: 400,
  minHeight: 340,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};
const profileImageStyle = {
  width: 70,
  height: 70,
  borderRadius: '50%',
  objectFit: 'cover',
  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
  marginBottom: 14,
  border: '2.5px solid #e0e7ef',
  background: '#f3f4f6',
  display: 'block',
};
const initialsStyle = {
  ...profileImageStyle,
  background: '#e0e7ef',
  color: '#4b5563',
  fontWeight: 700,
  fontSize: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  letterSpacing: 1,
};
const headerStyle = {
  fontWeight: 700,
  color: '#22223b',
  fontSize: 22,
  letterSpacing: 0.2,
  marginBottom: 18,
  textAlign: 'center',
};
const infoGrid = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '1fr 2fr',
  rowGap: 14,
  columnGap: 10,
  marginTop: 8,
};
const labelStyle = {
  fontWeight: 500,
  color: '#6b7280',
  fontSize: 15,
  textAlign: 'right',
  paddingRight: 8,
};
const valueStyle = {
  color: '#22223b',
  fontWeight: 500,
  fontSize: 16,
  wordBreak: 'break-all',
};

function getInitials(nameOrEmail) {
  if (!nameOrEmail) return '?';
  const parts = nameOrEmail.split('@')[0].split(/[ ._]/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const ProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/profile', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setProfile(data);
      })
      .catch(() => setError('Failed to load profile'));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div>Loading...</div>;

  return (
    <div style={cardStyle}>
      {profile.profile_image ? (
        <img
          src={`data:image/png;base64,${profile.profile_image}`}
          alt="Profile"
          style={profileImageStyle}
        />
      ) : (
        <div style={initialsStyle}>{getInitials(profile.username || profile.email)}</div>
      )}
      <div style={headerStyle}>Profile</div>
      <div style={infoGrid}>
        <div style={labelStyle}>Username:</div>
        <div style={valueStyle}>{profile.username}</div>
        <div style={labelStyle}>Email:</div>
        <div style={valueStyle}>{profile.email}</div>
        <div style={labelStyle}>Monthly Limit:</div>
        <div style={valueStyle}>{profile.monthly_limit}</div>
      </div>
    </div>
  );
};

export default ProfileView; 