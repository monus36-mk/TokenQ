import React from 'react';

export default function BottomNav({ 
  activeScreen, 
  onNavigate, 
  unreadNotifCount = 0, 
  activeTokenCount = 0,
  prescriptionCount = 0 
}) {
  return (
    <nav className="bottom-nav">
      <div 
        className={`bnav ${activeScreen === 'home' || activeScreen === 'detail' || activeScreen === 'book' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <span className="bnav-icon">🏥</span>
        <span>Clinics</span>
      </div>

      <div 
        className={`bnav ${activeScreen === 'tokens' || activeScreen === 'token' ? 'active' : ''}`}
        onClick={() => onNavigate('tokens')}
        style={{ position: 'relative' }}
      >
        <span className="bnav-icon">🎫</span>
        <span>My Tokens</span>
        {activeTokenCount > 0 && (
          <span className="bnav-badge">{activeTokenCount}</span>
        )}
      </div>

      <div 
        className={`bnav ${activeScreen === 'prescriptions' ? 'active' : ''}`}
        onClick={() => onNavigate('prescriptions')}
        style={{ position: 'relative' }}
      >
        <span className="bnav-icon">💊</span>
        <span>Prescriptions</span>
        {prescriptionCount > 0 && (
          <span className="bnav-badge count">{prescriptionCount}</span>
        )}
      </div>

      <div 
        className={`bnav ${activeScreen === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
      >
        <span className="bnav-icon">👤</span>
        <span>Profile</span>
      </div>
    </nav>
  );
}
