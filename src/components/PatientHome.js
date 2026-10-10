import React, { useState } from 'react';
import { isBookingExpired } from '@/lib/slotUtils';
import { StarIcon } from './StarIcon';

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
    : (userBookings || []).filter(b => {
        return (b.status === 'waiting' || b.status === 'serving') && !isBookingExpired(b);
      }).length;

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

  // 11 Standard Medical Specialties
  const MEDICAL_SPECIALTIES = [
    'General Physician',
    'Pediatrics',
    'Gynecology',
    'Dermatology',
    'Orthopedics',
    'Cardiology',
    'ENT',
    'Ophthalmology',
    'Dentistry',
    'Diabetology',
    'Physiotherapy'
  ];

  // Extract unique specialties from clinics and include the 11 standard medical specialties
  const uniqueCategories = Array.from(new Set([
    'All',
    ...MEDICAL_SPECIALTIES,
    ...clinics.map(c => c.specialty).filter(Boolean),
    ...clinics.flatMap(c => (c.doctors || []).map(d => d.specialty).filter(Boolean))
  ]));

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
      const matchSpec = (val) => {
        if (!val) return false;
        const vLower = val.toLowerCase();
        if (vLower === catLower || vLower.includes(catLower) || catLower.includes(vLower)) return true;
        if (catLower.includes('general') && (vLower.includes('general') || vLower.includes('physician'))) return true;
        if (catLower.includes('pediatric') && (vLower.includes('pediatric') || vLower.includes('paediatric') || vLower.includes('child'))) return true;
        if (catLower.includes('gynecol') && (vLower.includes('gynec') || vLower.includes('gynaec') || vLower.includes('women') || vLower.includes('obgyn'))) return true;
        if (catLower.includes('dermatol') && (vLower.includes('dermat') || vLower.includes('skin'))) return true;
        if (catLower.includes('orthoped') && (vLower.includes('orthoped') || vLower.includes('orthopaed') || vLower.includes('bone'))) return true;
        if (catLower.includes('cardio') && (vLower.includes('cardio') || vLower.includes('heart'))) return true;
        if (catLower === 'ent' && (vLower.includes('ent') || vLower.includes('ear') || vLower.includes('nose') || vLower.includes('throat'))) return true;
        if (catLower.includes('ophthalmol') && (vLower.includes('ophthal') || vLower.includes('eye') || vLower.includes('vision'))) return true;
        if (catLower.includes('dentist') && (vLower.includes('dent') || vLower.includes('tooth') || vLower.includes('teeth'))) return true;
        if (catLower.includes('diabetol') && (vLower.includes('diabet') || vLower.includes('sugar') || vLower.includes('endocrine'))) return true;
        if (catLower.includes('physiotherap') && (vLower.includes('physio') || vLower.includes('rehab') || vLower.includes('physical therapy'))) return true;
        return false;
      };

      const clinicSpecMatches = matchSpec(clinic.specialty);
      const doctorSpecMatches = clinic.doctors && clinic.doctors.some(doc => matchSpec(doc.specialty));
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

  // Dismissed Doctor-Cancelled Queue Alerts State
  const [dismissedCancelAlerts, setDismissedCancelAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('tokenq_dismissed_cancel_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleDismissCancelNotice = (tokenId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const updated = Array.from(new Set([...dismissedCancelAlerts, String(tokenId)]));
    setDismissedCancelAlerts(updated);
    try {
      localStorage.setItem('tokenq_dismissed_cancel_alerts', JSON.stringify(updated));
    } catch (err) {}
  };

  // Find active upcoming bookings (only non-expired slots)
  const activeBookings = (userBookings || []).filter(b => {
    return (b.status === 'waiting' || b.status === 'serving') && !isBookingExpired(b);
  });

  // Find recent doctor-cancelled bookings (only non-dismissed)
  const doctorCancelledBookings = (userBookings || []).filter(b => 
    b.status === 'cancelled' && 
    (b.cancelledBy === 'doctor' || b.cancelledBy === 'clinic-admin' || !b.cancelledBy) &&
    !dismissedCancelAlerts.includes(String(b._id)) &&
    new Date(b.cancelledAt || b.createdAt || Date.now()).toDateString() === new Date().toDateString()
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      
      {/* HOME HEADER */}
      <div className="home-header">
        <div className="home-header-top">
          <div>
            <div className="app-brand">Token<span>Q</span></div>
            <div className="loc" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{currentUser?.city || 'Thanjavur'}, Tamil Nadu</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  background: 'rgba(255, 255, 255, 0.22)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)'
                }}
              >
                Logout 🚪
              </button>
            ) : (
              <button 
                onClick={() => onNavigate('auth')}
                style={{
                  background: 'white',
                  color: '#065F46',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Sign In →
              </button>
            )}
          </div>
        </div>
        <div className="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            placeholder="Search clinics, specialists, or doctors..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* COMPACT & RESPONSIVE FILTER BAR */}
      <div className="smart-filters-bar">
        
        {/* Left Side: All filter chips (single horizontal row on PC, responsive wrap on Mobile) */}
        <div className="smart-filters-left">
          {/* Medical Specialty Dropdown Filter */}
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: selectedCategory !== 'All' ? 'var(--green-dark)' : 'currentColor' }}>
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
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

          {/* Main Filter Button (Opens full options modal) */}
          <button 
            className={`filter-trigger-btn ${activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => setShowFilterModal(true)}
            title="Click to customize all clinic filters and sort options"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="4" y1="21" y2="14" />
              <line x1="4" x2="4" y1="10" y2="3" />
              <line x1="12" x2="12" y1="21" y2="12" />
              <line x1="12" x2="12" y1="8" y2="3" />
              <line x1="20" x2="20" y1="21" y2="16" />
              <line x1="20" x2="20" y1="12" y2="3" />
              <line x1="1" x2="7" y1="14" y2="14" />
              <line x1="9" x2="15" y1="8" y2="8" />
              <line x1="17" x2="23" y1="16" y2="16" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="filter-count-badge">{activeFilterCount}</span>
            )}
          </button>

          {/* Quick Shortcut 1: Near Me (GPS) */}
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Near Me {isNearMeActive ? '✓' : ''}</span>
              </>
            )}
          </button>

          {/* Quick Shortcut 2: Open Now */}
          <button 
            className={`smart-chip ${isOpenNowOnly ? 'active' : ''}`}
            onClick={() => setIsOpenNowOnly(!isOpenNowOnly)}
            title="Show only open clinics"
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
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

        {/* Notifications Bell Icon on Far Right */}
        <button 
          onClick={onOpenNotifications}
          className="filter-bell-btn"
          title="Notifications & Checkup Reminders"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unreadNotifCount > 0 && (
            <span className="filter-bell-badge">
              {unreadNotifCount}
            </span>
          )}
        </button>

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
              
              {/* Section: Medical Specialty */}
              <div>
                <div className="filter-sec-title">🩺 Medical Specialty</div>
                <div className="filter-options-grid" style={{ maxHeight: '180px', overflowY: 'auto', padding: '2px 0' }}>
                  {uniqueCategories.map(cat => (
                    <button
                      key={cat}
                      className={`filter-option-pill ${selectedCategory === cat ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                      style={{ fontSize: '11.5px', padding: '6px 12px' }}
                    >
                      {cat === 'All' ? 'All Specialties' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 1: Proximity & Location */}
              <div>
                <div className="filter-sec-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="22" x2="18" y1="12" y2="12" />
                    <line x1="6" x2="2" y1="12" y2="12" />
                    <line x1="12" x2="12" y1="6" y2="2" />
                    <line x1="12" x2="12" y1="22" y2="18" />
                  </svg>
                  <span>Location & Distance</span>
                </div>
                <div 
                  className={`filter-toggle-row ${isNearMeActive ? 'selected' : ''}`}
                  onClick={handleToggleNearMe}
                  style={{
                    background: isNearMeActive ? 'rgba(14, 165, 233, 0.1)' : 'var(--surface2)',
                    borderColor: isNearMeActive ? '#0ea5e9' : 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isNearMeActive ? '#0ea5e9' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isNearMeActive ? '#fff' : 'var(--text)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="22" x2="18" y1="12" y2="12" />
                        <line x1="6" x2="2" y1="12" y2="12" />
                        <line x1="12" x2="12" y1="6" y2="2" />
                        <line x1="12" x2="12" y1="22" y2="18" />
                      </svg>
                    </div>
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
                <div className="filter-sec-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <StarIcon size={14} /> Patient Ratings
                </div>
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
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <StarIcon size={12} /> 4.5+ (Top Rated)
                  </button>
                  <button
                    className={`filter-option-pill ${ratingFilter === '4.0' ? 'selected' : ''}`}
                    onClick={() => setRatingFilter('4.0')}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <StarIcon size={12} /> 4.0+ (Popular)
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
          {/* Doctor Cancelled Slots Notice Banner */}
          {doctorCancelledBookings.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div className="sec-label" style={{ color: '#DC2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Doctor Session Updates</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 500 }}>Click ✕ to dismiss</span>
              </div>
              {doctorCancelledBookings.map((cb, idx) => {
                const clinic = clinics.find(c => String(c._id) === String(cb.clinicId)) || {};
                return (
                  <div 
                    key={cb._id ? `home-doc-cancel-${cb._id}-${idx}` : `home-doc-cancel-${idx}`} 
                    className="notice"
                    style={{ 
                      cursor: 'pointer', 
                      background: '#FEF2F2', 
                      borderColor: '#FCA5A5', 
                      borderLeftColor: '#DC2626',
                      borderLeftWidth: '4px',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)',
                      position: 'relative'
                    }}
                    onClick={() => {
                      handleDismissCancelNotice(cb._id);
                      onSelectToken(cb);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#991B1B' }}>
                        ⚠️ Doctor Cancelled Session (Token #{cb.tokenNumber})
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="pill pr" style={{ fontSize: '10px', padding: '2px 6px' }}>Cancelled</span>
                        <button
                          type="button"
                          onClick={(e) => handleDismissCancelNotice(cb._id, e)}
                          title="Dismiss this notice"
                          style={{
                            background: 'rgba(220, 38, 38, 0.1)',
                            border: 'none',
                            color: '#991B1B',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '3px' }}>
                      <strong>{clinic.name || 'Clinic'}:</strong> {cb.cancelReason || 'Doctor had to leave clinic early / emergency'}.
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600, textDecoration: 'underline' }}>
                        View Details & Find Another Clinic →
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDismissCancelNotice(cb._id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#7F1D1D',
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          textDecoration: 'underline'
                        }}
                      >
                        Dismiss Notice ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: isNearMeActive ? '#0284c7' : 'var(--green)' }}></span>
              {(() => {
                if (searchQuery.trim()) {
                  return `Search Results (${sortedClinics.length})`;
                }
                if (isNearMeActive) {
                  return `Nearest Clinics to You (${sortedClinics.length})`;
                }
                if (selectedCategory && selectedCategory !== 'All') {
                  return `Top ${selectedCategory} Clinics in Thanjavur (${sortedClinics.length})`;
                }
                if (isOpenNowOnly) {
                  return `Clinics Open Right Now (${sortedClinics.length})`;
                }
                if (ratingFilter !== 'all') {
                  return `Highest Rated Clinics (${sortedClinics.length})`;
                }
                return `Top & Recommended Clinics in Thanjavur (${sortedClinics.length})`;
              })()}
            </div>
            {isNearMeActive && userCoords && (
              <span style={{ fontSize: '10px', color: '#0284c7', textTransform: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" x2="18" y1="12" y2="12" />
                  <line x1="6" x2="2" y1="12" y2="12" />
                  <line x1="12" x2="12" y1="6" y2="2" />
                  <line x1="12" x2="12" y1="22" y2="18" />
                </svg>
                GPS Active
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
                      <div className="card-icon" style={{ background: clinic.profilePic ? 'transparent' : (clinic.icon === '🦷' ? '#FAEEDA' : clinic.icon === '👶' ? '#FBEAF0' : 'var(--green-light)'), overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {clinic.profilePic ? (
                          <img src={clinic.profilePic} alt={clinic.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : clinic.icon && clinic.icon !== '🏥' ? (
                          clinic.icon
                        ) : (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 6v4" />
                            <path d="M10 8h4" />
                            <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
                            <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2" />
                            <path d="M10 22v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" />
                          </svg>
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
                            <div className="card-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span>{clinic.address ? `${clinic.address} · ` : ''}</span>
                              <span style={{ color: 'var(--green-dark)', fontWeight: 500 }}>{displaySpecialties}</span>
                            </div>
                          );
                        })()}
                        
                        <div className="card-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                          <span className={`pill ${!isClinicOpen(clinic) ? 'pr' : 'pg'}`}>
                            {!isClinicOpen(clinic) ? 'Closed' : 'Open'}
                          </span>

                          {/* Distance badge if location is active */}
                          {formattedDist && (
                            <span className="pill pdist" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="22" x2="18" y1="12" y2="12" />
                                <line x1="6" x2="2" y1="12" y2="12" />
                                <line x1="12" x2="12" y1="6" y2="2" />
                                <line x1="12" x2="12" y1="22" y2="18" />
                              </svg>
                              <span>{formattedDist}</span>
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
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#B45309' }}>
                              {clinic.rating} <StarIcon size={14} />
                            </span>
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
