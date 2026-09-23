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
  clinics = [], 
  userBookings = [], 
  onSelectClinic, 
  onSelectToken, 
  onNavigate, 
  searchQuery = '', 
  setSearchQuery,
  currentUser,
  onOpenNotifications,
  unreadNotifCount = 0,
  activeTokenCount: propActiveTokenCount,
  prescriptionCount: propPrescriptionCount
}) {
  const activeTokenCount = propActiveTokenCount !== undefined 
    ? propActiveTokenCount 
    : (userBookings || []).filter(b => b.status === 'waiting' || b.status === 'serving').length;

  const prescriptionCount = propPrescriptionCount !== undefined 
    ? propPrescriptionCount 
    : (userBookings || []).filter(b => Boolean(b.prescription || (b.medicines && b.medicines.length > 0) || b.clinicalNotes)).length;

  // Filter & Modal States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isOpenNowOnly, setIsOpenNowOnly] = useState(false);
  const [isTopRatedOnly, setIsTopRatedOnly] = useState(false);
  const [isLowestWaitOnly, setIsLowestWaitOnly] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState('all'); // 'all', '300', '500'
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all', '4.5', '4.0'
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Extract unique specialties
  const uniqueSpecialties = Array.from(new Set([
    'All',
    ...clinics.map(c => c.specialty).filter(Boolean),
    ...clinics.flatMap(c => (c.doctors || []).map(d => d.specialty).filter(Boolean))
  ])).map(spec => {
    const specLower = spec.toLowerCase();
    if (specLower.includes('general')) return 'General';
    if (specLower.includes('dental')) return 'Dental';
    if (specLower.includes('paediatric') || specLower.includes('pediatric')) return 'Paediatric';
    if (specLower.includes('orthopaedic') || specLower.includes('orthopedic')) return 'Orthopaedic';
    if (specLower.includes('gynaec')) return 'Gynaecology';
    if (specLower.includes('dermat')) return 'Dermatology';
    if (specLower.includes('ophthal')) return 'Ophthalmology';
    return spec.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  });
  const uniqueCategories = Array.from(new Set(uniqueSpecialties));

  // Geolocation trigger for "Near Me" filter
  const handleToggleNearMe = () => {
    if (isNearMeActive) {
      setIsNearMeActive(false);
      return;
    }
    
    if (userCoords) {
      setIsNearMeActive(true);
      return;
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          setIsNearMeActive(true);
          setIsLocating(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setIsLocating(false);
          alert('Could not access your location. Please check your browser GPS permissions to find nearby clinics.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Haversine distance calculator in kilometers
  const getClinicDistance = (clinic, coords) => {
    if (!coords || clinic.latitude === undefined || clinic.longitude === undefined || clinic.latitude === null || clinic.longitude === null) {
      return null;
    }
    const lat1 = coords.latitude;
    const lon1 = coords.longitude;
    const lat2 = Number(clinic.latitude);
    const lon2 = Number(clinic.longitude);
    if (isNaN(lat2) || isNaN(lon2)) return null;

    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (distKm) => {
    if (distKm === null || distKm === undefined) return null;
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m away`;
    }
    return `${distKm.toFixed(1)} km away`;
  };

  // Wait time parser to sort by shortest queue
  const parseWaitMinutes = (clinic) => {
    if (!clinic) return 999;
    if (!isClinicOpen(clinic)) return 9999;
    const waitStr = (clinic.avgWaitTime || '').toLowerCase();
    if (waitStr.includes('no wait') || waitStr.includes('ready')) return 0;
    const hrMatch = waitStr.match(/(\d+)\s*hr/);
    if (hrMatch) return parseInt(hrMatch[1], 10) * 60;
    const minMatch = waitStr.match(/(\d+)\s*m/);
    if (minMatch) return parseInt(minMatch[1], 10);
    return 15;
  };

  // Clean wait label
  const formatWaitLabel = (clinic) => {
    if (!isClinicOpen(clinic)) return 'No wait';
    const waitStr = (clinic.avgWaitTime || 'Ready / No wait').trim();
    if (waitStr.toLowerCase().endsWith('wait')) return waitStr;
    return `${waitStr} wait`;
  };

  // Count active applied filters
  const activeFilterCount = 
    (isOpenNowOnly ? 1 : 0) +
    (ratingFilter !== 'all' ? 1 : 0) +
    (isLowestWaitOnly ? 1 : 0) +
    (budgetLimit !== 'all' ? 1 : 0) +
    (isNearMeActive ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setIsOpenNowOnly(false);
    setRatingFilter('all');
    setIsLowestWaitOnly(false);
    setBudgetLimit('all');
    setIsNearMeActive(false);
  };

  // Filter clinics
  const filteredClinics = clinics.filter(clinic => {
    // 1. Specialty Category
    let matchesCategory = selectedCategory === 'All';
    if (!matchesCategory) {
      const catLower = selectedCategory.toLowerCase();
      const clinicSpecMatches = clinic.specialty && clinic.specialty.toLowerCase().includes(catLower);
      const doctorSpecMatches = clinic.doctors && clinic.doctors.some(doc => 
        doc.specialty && doc.specialty.toLowerCase().includes(catLower)
      );
      matchesCategory = clinicSpecMatches || doctorSpecMatches;
    }

    // 2. Search Text
    const matchesSearch = clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (clinic.doctorName && clinic.doctorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (clinic.specialty && clinic.specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (clinic.doctors && clinic.doctors.some(doc => 
                            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())
                          ));

    // 3. Open Now filter
    if (isOpenNowOnly && !isClinicOpen(clinic)) {
      return false;
    }

    // 4. Rating filter
    if (ratingFilter === '4.5' && (clinic.rating || 0) < 4.5) return false;
    if (ratingFilter === '4.0' && (clinic.rating || 0) < 4.0) return false;

    // 5. Budget filter
    if (budgetLimit === '300' && clinic.fee && clinic.fee > 300) return false;
    if (budgetLimit === '500' && clinic.fee && clinic.fee > 500) return false;

    return matchesCategory && matchesSearch;
  });

  // Sort clinics
  const sortedClinics = [...filteredClinics].sort((a, b) => {
    // 1. Near Me active -> sort by distance (closest first)
    if (isNearMeActive && userCoords) {
      const distA = getClinicDistance(a, userCoords);
      const distB = getClinicDistance(b, userCoords);
      if (distA !== null && distB !== null) return distA - distB;
      if (distA !== null) return -1;
      if (distB !== null) return 1;
    }

    // 2. Lowest Wait Time active -> sort by wait minutes
    if (isLowestWaitOnly) {
      const waitA = parseWaitMinutes(a);
      const waitB = parseWaitMinutes(b);
      if (waitA !== waitB) return waitA - waitB;
    }

    // 3. Rating sort if rating filter is applied
    if (ratingFilter !== 'all') {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
    }

    // Default: Open clinics first, then rating, then bookedCount
    const aOpen = isClinicOpen(a);
    const bOpen = isClinicOpen(b);
    if (aOpen && !bOpen) return -1;
    if (!aOpen && bOpen) return 1;

    const ratingDiff = (b.rating || 0) - (a.rating || 0);
    if (ratingDiff !== 0) return ratingDiff;

    return (b.bookedCount || 0) - (a.bookedCount || 0);
  });

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Top-Right Notification Bell */}
            <button 
              onClick={onOpenNotifications}
              style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                cursor: 'pointer',
                color: 'white',
                flexShrink: 0
              }}
              title="Notifications & Checkup Reminders"
            >
              <span>🔔</span>
              {unreadNotifCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: '#EF4444',
                  color: 'white',
                  borderRadius: '10px',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  border: '1.5px solid #064E3B'
                }}>
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
              {currentUser ? `Hi, ${currentUser?.name?.split(' ')[0]}!` : 'Welcome!'}
            </span>
            {currentUser ? (
              <button 
                onClick={() => {
                  localStorage.removeItem('tokenq_user');
                  window.location.reload();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  color: 'white',
                  border: 'none',
                  padding: '5px 9px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Logout 🚪
              </button>
            ) : (
              <button 
                onClick={() => onNavigate('auth')}
                style={{
                  background: 'white',
                  color: 'var(--green-dark)',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Sign In →
              </button>
            )}
          </div>
        </div>
        <div className="search-bar">
          <span>🔍</span>
          <input 
            type="text" 
            placeholder="Search clinics, specialists, or doctors..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* COMPACT & FRIENDLY FILTER BAR */}
      <div className="smart-filters-bar" style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', overflow: 'visible', position: 'relative' }}>
        
        {/* 🩺 Medical Specialty Dropdown Filter */}
        <div style={{ position: 'relative' }}>
          <button 
            className={`smart-chip ${selectedCategory !== 'All' ? 'active' : ''}`}
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            title="Click to select medical specialty"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>🩺</span>
            <span>Specialty: <strong style={{ color: selectedCategory !== 'All' ? 'var(--green-dark)' : 'inherit' }}>{selectedCategory}</strong></span>
            <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '2px' }}>▾</span>
          </button>

          {showCategoryDropdown && (
            <>
              <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                onClick={() => setShowCategoryDropdown(false)}
              />
              <div 
                className="card"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  zIndex: 999,
                  minWidth: '220px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  padding: '6px 0',
                  margin: 0
                }}
              >
                {uniqueCategories.map(cat => (
                  <div 
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowCategoryDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: selectedCategory === cat ? 700 : 500,
                      color: selectedCategory === cat ? 'var(--green-dark)' : 'var(--text)',
                      background: selectedCategory === cat ? 'var(--green-light)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== cat) e.currentTarget.style.background = 'var(--surface2)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== cat) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{cat === 'All' ? 'All Specialties' : cat}</span>
                    {selectedCategory === cat && <span style={{ fontSize: '13px', color: 'var(--green-dark)' }}>✓</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 🎛️ Main Filter Button (Opens full options modal) */}
        <button 
          className={`filter-trigger-btn ${activeFilterCount > 0 ? 'active' : ''}`}
          onClick={() => setShowFilterModal(true)}
          title="Click to customize all clinic filters and sort options"
        >
          <span>🎛️</span>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="filter-count-badge">{activeFilterCount}</span>
          )}
        </button>

        {/* Quick Shortcut 1: 📍 Near Me (GPS) */}
        <button 
          className={`smart-chip ${isNearMeActive ? 'active-near' : ''}`}
          onClick={handleToggleNearMe}
          title="Find nearest clinics based on your current location"
        >
          {isLocating ? (
            <>
              <span className="loc-pulse-dot"></span>
              <span>Locating...</span>
            </>
          ) : (
            <>
              <span>📍</span>
              <span>Near Me {isNearMeActive ? '✓' : ''}</span>
            </>
          )}
        </button>

        {/* Quick Shortcut 2: 🟢 Open Now */}
        <button 
          className={`smart-chip ${isOpenNowOnly ? 'active' : ''}`}
          onClick={() => setIsOpenNowOnly(!isOpenNowOnly)}
          title="Show only open clinics"
        >
          <span>🟢</span>
          <span>Open Now {isOpenNowOnly ? '✓' : ''}</span>
        </button>

        {/* Quick Reset if filters applied */}
        {(activeFilterCount > 0 || selectedCategory !== 'All') && (
          <button 
            className="smart-chip reset-chip"
            onClick={resetAllFilters}
            title="Clear all active filters"
          >
            <span>✕ Reset</span>
          </button>
        )}

      </div>

      {/* POPUP / BOTTOM DRAWER FILTER MODAL */}
      {showFilterModal && (
        <div className="filter-modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="filter-modal-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="filter-modal-header">
              <div className="filter-modal-title">
                <span>🎛️</span>
                <span>Filter & Sort Clinics</span>
              </div>
              <button 
                onClick={() => setShowFilterModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: 'var(--text3)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="filter-modal-body">
              
              {/* Section 1: Proximity & Location */}
              <div>
                <div className="filter-sec-title">📍 Location & Distance</div>
                <div 
                  className={`filter-toggle-row ${isNearMeActive ? 'selected' : ''}`}
                  onClick={handleToggleNearMe}
                  style={{
                    background: isNearMeActive ? 'rgba(14, 165, 233, 0.1)' : 'var(--surface2)',
                    borderColor: isNearMeActive ? '#0ea5e9' : 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>📍</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                        Sort by Nearest to Me (GPS)
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        Calculates driving/walking distance in km
                      </div>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isNearMeActive} 
                    onChange={() => {}} 
                    style={{ width: '18px', height: '18px', accentColor: '#0ea5e9', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Section 3: Availability */}
              <div>
                <div className="filter-sec-title">🟢 Clinic Status</div>
                <div 
                  className={`filter-toggle-row ${isOpenNowOnly ? 'selected' : ''}`}
                  onClick={() => setIsOpenNowOnly(!isOpenNowOnly)}
                  style={{
                    background: isOpenNowOnly ? 'var(--green-light)' : 'var(--surface2)',
                    borderColor: isOpenNowOnly ? 'var(--green)' : 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🟢</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                        Open Now Only
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        Hide clinics that are currently closed today
                      </div>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isOpenNowOnly} 
                    onChange={() => {}} 
                    style={{ width: '18px', height: '18px', accentColor: 'var(--green-dark)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Section 4: Rating */}
              <div>
                <div className="filter-sec-title">⭐ Patient Ratings</div>
                <div className="filter-options-grid">
                  <button
                    className={`filter-option-pill ${ratingFilter === 'all' ? 'selected' : ''}`}
                    onClick={() => setRatingFilter('all')}
                  >
                    All Ratings
                  </button>
                  <button
                    className={`filter-option-pill ${ratingFilter === '4.5' ? 'selected' : ''}`}
                    onClick={() => setRatingFilter('4.5')}
                  >
                    ⭐ 4.5+ (Top Rated)
                  </button>
                  <button
                    className={`filter-option-pill ${ratingFilter === '4.0' ? 'selected' : ''}`}
                    onClick={() => setRatingFilter('4.0')}
                  >
                    ⭐ 4.0+ (Popular)
                  </button>
                </div>
              </div>

              {/* Section 5: Wait Time */}
              <div>
                <div className="filter-sec-title">⏱️ Queue & Wait Time</div>
                <div className="filter-options-grid">
                  <button
                    className={`filter-option-pill ${!isLowestWaitOnly ? 'selected' : ''}`}
                    onClick={() => setIsLowestWaitOnly(false)}
                  >
                    Default
                  </button>
                  <button
                    className={`filter-option-pill ${isLowestWaitOnly ? 'selected' : ''}`}
                    onClick={() => setIsLowestWaitOnly(true)}
                  >
                    ⏱️ Lowest Wait Time First
                  </button>
                </div>
              </div>

              {/* Section 6: Consultation Fee */}
              <div>
                <div className="filter-sec-title">Consultation Fee</div>
                <div className="filter-options-grid">
                  <button
                    className={`filter-option-pill ${budgetLimit === 'all' ? 'selected' : ''}`}
                    onClick={() => setBudgetLimit('all')}
                  >
                    All Fees
                  </button>
                  <button
                    className={`filter-option-pill ${budgetLimit === '300' ? 'selected' : ''}`}
                    onClick={() => setBudgetLimit('300')}
                  >
                    Under ₹300 (Budget)
                  </button>
                  <button
                    className={`filter-option-pill ${budgetLimit === '500' ? 'selected' : ''}`}
                    onClick={() => setBudgetLimit('500')}
                  >
                    Under ₹500
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="filter-modal-footer">
              <button
                onClick={resetAllFilters}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>

              <button
                onClick={() => setShowFilterModal(false)}
                style={{
                  flex: 1,
                  background: 'var(--green-dark)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                Apply Filters ({sortedClinics.length} Clinics)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Clinics and Bookings scrollable area */}
      <div className="scrollable">
        <div className="pad">
          
          {/* Active Bookings Notice */}
          {activeBookings.length > 0 && (
            <>
              <div className="sec-label">Your upcoming bookings</div>
              {activeBookings.map((booking, idx) => {
                const clinic = clinics.find(c => c._id === booking.clinicId) || {};
                const isServing = booking.status === 'serving';
                
                return (
                  <div 
                    key={booking._id ? `home-up-${booking._id}-${idx}` : `home-up-${idx}`} 
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

          {/* Clinics Section Header */}
          <div className="sec-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }}></span>
              {isNearMeActive ? 'Clinics sorted by proximity' : 'Clinics near you'} ({sortedClinics.length})
            </div>
            {isNearMeActive && userCoords && (
              <span style={{ fontSize: '10px', color: '#0284c7', textTransform: 'none', fontWeight: 600 }}>
                📍 GPS Active
              </span>
            )}
          </div>

          {sortedClinics.length > 0 ? (
            <div className="clinics-grid">
              {sortedClinics.map((clinic, idx) => {
                const dist = userCoords ? getClinicDistance(clinic, userCoords) : null;
                const formattedDist = formatDistance(dist);

                return (
                  <div key={clinic._id ? `home-cl-${clinic._id}-${idx}` : `home-cl-${idx}`} className="card" onClick={() => onSelectClinic(clinic)} style={{ margin: 0 }}>
                    <div className="card-row">
                      <div className="card-icon" style={{ background: clinic.profilePic ? 'transparent' : (clinic.icon === '🦷' ? '#FAEEDA' : clinic.icon === '👶' ? '#FBEAF0' : '#E1F5EE'), overflow: 'hidden', padding: 0 }}>
                        {clinic.profilePic ? (
                          <img src={clinic.profilePic} alt={clinic.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          clinic.icon || '🏥'
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="card-name">{clinic.name}</div>
                        {(() => {
                          const uniqueDocSpecs = Array.from(new Set((clinic.doctors || []).map(d => d.specialty).filter(Boolean)));
                          const displaySpecialties = uniqueDocSpecs.length > 0 
                            ? uniqueDocSpecs.join(', ') 
                            : clinic.specialty;
                          return (
                            <div className="card-meta">
                              📍 {clinic.address} · <span style={{ color: 'var(--green-dark)', fontWeight: 500 }}>{displaySpecialties}</span>
                            </div>
                          );
                        })()}
                        
                        <div className="card-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                          <span className={`pill ${!isClinicOpen(clinic) ? 'pr' : 'pg'}`}>
                            {!isClinicOpen(clinic) ? 'Closed' : 'Open'}
                          </span>

                          {/* Distance badge if location is active */}
                          {formattedDist && (
                            <span className="pill pdist">
                              📍 {formattedDist}
                            </span>
                          )}

                          {/* Consultation fee badge */}
                          {clinic.fee !== undefined && clinic.fee !== null && (
                            <span className="pill pfee">
                              ₹{clinic.fee} fee
                            </span>
                          )}

                          <span className="pill pa">
                            {clinic.bookedCount || 0} booked today
                          </span>
                          
                          <span className="pill pb">
                            {formatWaitLabel(clinic)}
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
                          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span>{clinic.rating} ⭐</span>
                            <span style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>({clinic.ratingCount} reviews)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px 0', fontSize: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
              No clinics found matching your active filters.
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={resetAllFilters}
                  style={{
                    background: 'var(--green-dark)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
