import React from 'react';

export default function BottomNav({ 
  activeScreen, 
  onNavigate, 
  unreadNotifCount = 0, 
  activeTokenCount = 0,
  prescriptionCount = 0 
}) {
  const isClinicsActive = activeScreen === 'home' || activeScreen === 'detail' || activeScreen === 'book';
  const isTokensActive = activeScreen === 'tokens' || activeScreen === 'token';
  const isPrescriptionsActive = activeScreen === 'prescriptions';
  const isProfileActive = activeScreen === 'profile';

  return (
    <nav className="bottom-nav">
      <div 
        className={`bnav ${isClinicsActive ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <span className="bnav-icon">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isClinicsActive ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6v4" />
            <path d="M10 8h4" />
            <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
            <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2" />
            <path d="M10 22v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" />
          </svg>
        </span>
        <span>Clinics</span>
      </div>

      <div 
        className={`bnav ${isTokensActive ? 'active' : ''}`}
        onClick={() => onNavigate('tokens')}
        style={{ position: 'relative' }}
      >
        <span className="bnav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isTokensActive ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 11v2" />
            <path d="M13 17v2" />
          </svg>
        </span>
        <span>My Tokens</span>
        {activeTokenCount > 0 && (
          <span className="bnav-badge">{activeTokenCount}</span>
        )}
      </div>

      <div 
        className={`bnav ${isPrescriptionsActive ? 'active' : ''}`}
        onClick={() => onNavigate('prescriptions')}
        style={{ position: 'relative' }}
      >
        <span className="bnav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isPrescriptionsActive ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
            <path d="m8.5 8.5 7 7" />
          </svg>
        </span>
        <span>Prescriptions</span>
        {prescriptionCount > 0 && (
          <span className="bnav-badge count">{prescriptionCount}</span>
        )}
      </div>

      <div 
        className={`bnav ${isProfileActive ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
      >
        <span className="bnav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isProfileActive ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        <span>Profile</span>
      </div>
    </nav>
  );
}
