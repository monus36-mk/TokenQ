import React, { useState } from 'react';

const isClinicOpen = (clinic) => {
  if (!clinic) return false;
  if (clinic.isUnavailable) return false;
  if (!clinic.doctors || clinic.doctors.length === 0) return false;
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = days[new Date().getDay()];
  if (clinic.activeDays && !clinic.activeDays.includes(todayDay)) {
    return false;
  }
  return true;
};

export default function PatientHome({ 
  clinics, 
  userBookings, 
  onSelectClinic, 
  onSelectToken, 
  onNavigate, 
  searchQuery, 
  setSearchQuery,
  currentUser
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter clinics based on category and search query
  const filteredClinics = clinics.filter(clinic => {
    const matchesCategory = selectedCategory === 'All' || clinic.specialty === selectedCategory;
    const matchesSearch = clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          clinic.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          clinic.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'General', 'Dental', 'Paediatric'];

  // Find active upcoming bookings
  const activeBookings = userBookings.filter(b => b.status === 'waiting' || b.status === 'serving');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      
      {/* HOME HEADER */}
      <div className="home-header">
        <div className="home-header-top">
          <div>
            <div className="app-brand">Token<span>Q</span></div>
            <div className="loc">📍 {currentUser?.city || 'Thanjavur'}, Tamil Nadu</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 500 }}>
              Hi, {currentUser?.name?.split(' ')[0] || 'Patient'}!
            </span>
            <button 
              onClick={() => {
                localStorage.removeItem('tokenq_user');
                window.location.reload();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                color: 'white',
                border: 'none',
                padding: '3px 7px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Logout 🚪
            </button>
          </div>
        </div>
        <div className="search-bar">
          <span>🔍</span>
          <input 
            type="text" 
            placeholder="Search clinics, specialists..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="cats">
        {categories.map(cat => (
          <div 
            key={cat}
            className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </div>
        ))}
      </div>

      {/* Clinics and Bookings scrollable area */}
      <div className="scrollable">
        <div className="pad">
          
          {/* Active Bookings Notice */}
          {activeBookings.length > 0 && (
            <>
              <div className="sec-label">Your upcoming bookings</div>
              {activeBookings.map(booking => {
                const clinic = clinics.find(c => c._id === booking.clinicId) || {};
                const isServing = booking.status === 'serving';
                
                return (
                  <div 
                    key={booking._id} 
                    className="notice"
                    style={{ cursor: 'pointer', borderLeftColor: 'var(--green)' }}
                    onClick={() => onSelectToken(booking)}
                  >
                    🎟️ <strong style={{ color: 'var(--text)' }}>Token {booking.tokenNumber}</strong> · {clinic.name || 'General Clinic'} · {booking.slot}
                    <br />
                    {isServing ? (
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>Your turn! Go inside now</span>
                    ) : (
                      <span style={{ color: 'var(--amber)', fontWeight: 600 }}>Waiting in queue · {booking.status}</span>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Clinics Section */}
          <div className="sec-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }}></span>
            Clinics near you
          </div>

          {filteredClinics.length > 0 ? (
            <div className="clinics-grid">
              {filteredClinics.map(clinic => (
                <div key={clinic._id} className="card" onClick={() => onSelectClinic(clinic)} style={{ margin: 0 }}>
                  <div className="card-row">
                    <div className="card-icon" style={{ background: clinic.icon === '🦷' ? '#FAEEDA' : clinic.icon === '👶' ? '#FBEAF0' : '#E1F5EE' }}>
                      {clinic.icon || '🏥'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="card-name">{clinic.name}</div>
                      <div className="card-meta">📍 {clinic.address} · {clinic.specialty}</div>
                      <div className="card-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <span className={`pill ${!isClinicOpen(clinic) ? 'pr' : 'pg'}`}>
                          {!isClinicOpen(clinic) ? 'Closed' : 'Open'}
                        </span>
                        <span className="pill pa">
                          {clinic.bookedCount} booked today
                        </span>
                        <span className="pill pb">
                          {!isClinicOpen(clinic) ? 'No wait' : `${clinic.avgWaitTime} wait`}
                        </span>
                        {clinic.delayMinutes > 0 && (
                          <span className="pill pr">Delayed +{clinic.delayMinutes}m</span>
                        )}
                      </div>
                    </div>
                    <div className="rating">
                      {clinic.ratingCount === 0 ? (
                        <span style={{ color: 'var(--green-dark)', fontWeight: 600 }}>New</span>
                      ) : (
                        `${clinic.rating} ⭐`
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px 0', fontSize: '14px' }}>
              No clinics found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <div className="bottom-nav">
        <div className="bnav active" onClick={() => onNavigate('home')}>
          <div className="bnav-icon">🏠</div>Home
        </div>
        <div className="bnav" onClick={() => onNavigate('search')}>
          <div className="bnav-icon">🔍</div>Search
        </div>
        <div className="bnav" onClick={() => onNavigate('tokens')}>
          <div className="bnav-icon">🎟️</div>Tokens
        </div>
        <div className="bnav" onClick={() => onNavigate('profile')}>
          <div className="bnav-icon">👤</div>Profile
        </div>
      </div>

    </div>
  );
}
