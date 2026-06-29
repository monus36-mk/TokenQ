import React from 'react';

export default function ClinicDetail({ clinic, onBack, onStartBooking }) {
  const booked = clinic.bookedCount || 0;
  const total = clinic.totalTokens || 40;
  const left = Math.max(0, total - booked);
  const fillPercent = Math.min(100, Math.round((booked / total) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      
      {/* HERO (detail page) */}
      <div className="hero">
        <div className="topbar" style={{ background: 'transparent', border: 'none', padding: '0 0 13px', color: 'white' }}>
          <div className="back-btn" style={{ background: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.2)', color: 'white' }} onClick={onBack}>←</div>
          <div className="topbar-title" style={{ color: 'white' }}>Clinic details</div>
          <span className={`pill ${clinic.isUnavailable ? 'pr' : 'pg'}`} style={{ fontSize: '11px' }}>
            {clinic.isUnavailable ? 'Closed' : 'Open'}
          </span>
        </div>
        <div className="hero-row">
          <div className="hero-icon">{clinic.icon || '🏥'}</div>
          <div>
            <div className="hero-name">{clinic.name}</div>
            <div className="hero-sub">{clinic.doctorName} · {clinic.specialty} Specialist</div>
            <div style={{ marginTop: '6px' }}>
              <span className="pill" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.9)', fontSize: '11px' }}>
                {clinic.rating} ⭐ · {clinic.ratingCount || 100} reviews
              </span>
            </div>
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-num">{booked}</div>
            <div className="stat-lbl">Booked</div>
          </div>
          <div className="stat-box">
            <div className="stat-num" style={{ color: 'var(--green-mid)' }}>{left}</div>
            <div className="stat-lbl">Slots left</div>
          </div>
          <div className="stat-box">
            <div className="stat-num" style={{ color: '#FBBF24' }}>
              {clinic.isUnavailable ? '-' : (clinic.delayMinutes > 0 ? `~${45 + clinic.delayMinutes}m` : clinic.avgWaitTime)}
            </div>
            <div className="stat-lbl">Est. wait</div>
          </div>
        </div>
      </div>

      {/* INFO SCROLLABLE */}
      <div className="scrollable">
        <div className="pad">
          <div className="sec-label">Info</div>
          <div className="ilist">
            <div className="irow">
              <span className="ilabel">🕕 Timings</span>
              <span className="ival" style={{ color: 'var(--green-dark)', fontWeight: 600 }}>{clinic.timings}</span>
            </div>
            <div className="irow">
              <span className="ilabel">📍 Address</span>
              <span className="ival">{clinic.address}</span>
            </div>
            <div className="irow">
              <span className="ilabel">💰 Fee</span>
              <span className="ival">₹{clinic.fee} consultation</span>
            </div>
            <div className="irow">
              <span className="ilabel">📞 Contact</span>
              <span className="ival" style={{ color: 'var(--blue)' }}>{clinic.contact}</span>
            </div>
          </div>

          <div className="prog">
            <div className="prog-fill" style={{ width: `${fillPercent}%` }}></div>
          </div>
          <div className="prog-lbl">{fillPercent}% filled · {left} slots open today</div>
          
          <div style={{ height: '14px' }}></div>
          
          <button 
            className="btn-p" 
            onClick={onStartBooking}
            disabled={clinic.isUnavailable || left === 0 || clinic.isPaused}
            style={{ opacity: (clinic.isUnavailable || left === 0 || clinic.isPaused) ? 0.5 : 1 }}
          >
            {clinic.isUnavailable ? 'Clinic Closed Today' : clinic.isPaused ? 'Bookings Paused' : '🎟️ Book a token'}
          </button>

          <div className="sec-label">Reviews</div>
          <div className="card" style={{ cursor: 'default' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Priya S.</div>
            <div style={{ fontSize: '12px', color: '#B07D10', margin: '3px 0' }}>⭐⭐⭐⭐⭐ · Yesterday</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Got the alert when my turn was near and arrived just in time. No waiting at all.</div>
          </div>
          <div className="card" style={{ cursor: 'default' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Murugan K.</div>
            <div style={{ fontSize: '12px', color: '#B07D10', margin: '3px 0' }}>⭐⭐⭐⭐ · 3 days ago</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Really useful app. Saved me from waiting 2 hours like before.</div>
          </div>
        </div>
      </div>

    </div>
  );
}
