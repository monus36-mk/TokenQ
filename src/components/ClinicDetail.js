import React, { useState } from 'react';
import { isBookingExpired } from '@/lib/slotUtils';
import { StarIcon, StarRatingRow } from './StarIcon';

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

export default function ClinicDetail({ clinic, onBack, onStartBooking, currentUser, onReviewAdded, waitingCount = 0, onRequireAuth, bookings = [] }) {
  const booked = bookings.filter(b =>
    b.clinicId === clinic._id &&
    b.status !== 'cancelled' &&
    b.status !== 'expired' &&
    !isBookingExpired(b) &&
    new Date(b.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedDocFilter, setSelectedDocFilter] = useState(null);

  // Dynamic wait time based on actual waiting queue length
  const dynamicWaitTime = waitingCount > 0 ? `~${(waitingCount * 10) + (clinic.delayMinutes || 0)}m` : 'Ready / No wait';

  const clinicDoctors = clinic.doctors && clinic.doctors.length > 0
    ? clinic.doctors
    : (clinic.doctorName ? [{ name: clinic.doctorName, specialty: clinic.specialty, timings: clinic.timings, session: 'Morning', isUnavailable: false, isPaused: false }] : []);

  const totalDoctorsCount = clinicDoctors.length;
  const activeDoctorsCount = clinicDoctors.filter(d => !d.isUnavailable && !d.isPaused).length;

  const reviews = [...(clinic.reviews || [])].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
  const filteredReviews = selectedDocFilter
    ? reviews.filter(r => r.doctorName === selectedDocFilter)
    : reviews;
  const visibleReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 2);

  const [isSaved, setIsSaved] = useState(() => {
    try {
      const saved = localStorage.getItem('tokenq_saved_clinics');
      const list = saved ? JSON.parse(saved) : [];
      return list.includes(clinic._id);
    } catch (e) {
      return false;
    }
  });

  const toggleSaveClinic = () => {
    try {
      const saved = localStorage.getItem('tokenq_saved_clinics');
      let list = saved ? JSON.parse(saved) : [];
      if (list.includes(clinic._id)) {
        list = list.filter(id => id !== clinic._id);
        setIsSaved(false);
      } else {
        list.push(clinic._id);
        setIsSaved(true);
      }
      localStorage.setItem('tokenq_saved_clinics', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '20px 24px' }}>

      {/* HERO (detail page) */}
      <div className="hero" style={{ borderRadius: 'var(--radius)', marginBottom: '24px' }}>
        <div className="topbar" style={{ background: 'transparent', border: 'none', padding: '0 0 13px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="back-btn" style={{ background: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.2)', color: 'white' }} onClick={onBack}>←</div>
            <div className="topbar-title" style={{ color: 'white' }}>Clinic details</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleSaveClinic}
              title={isSaved ? "Saved clinic" : "Save this clinic"}
              style={{
                background: isSaved ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,.15)',
                border: isSaved ? '1px solid #f87171' : '1px solid rgba(255,255,255,.25)',
                color: 'white',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={isSaved ? "#EF4444" : "none"} stroke={isSaved ? "#EF4444" : "currentColor"} strokeWidth="2.5">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <span className={`pill ${!isClinicOpen(clinic) ? 'pr' : 'pg'}`} style={{ fontSize: '11px' }}>
              {!isClinicOpen(clinic) ? 'Closed' : 'Open'}
            </span>
          </div>
        </div>
        <div className="hero-row">
          <div className="hero-icon" style={{ padding: clinic.profilePic ? 0 : '', overflow: 'hidden' }}>
            {clinic.profilePic ? (
              <img src={clinic.profilePic} alt={clinic.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            ) : clinic.icon && clinic.icon !== '🏥' ? (
              clinic.icon
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6v4" />
                <path d="M10 8h4" />
                <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
                <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2" />
                <path d="M10 22v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" />
              </svg>
            )}
          </div>
          <div>
            <div className="hero-name">{clinic.name}</div>
            {(() => {
              const uniqueDocSpecs = Array.from(new Set((clinic.doctors || []).map(d => d.specialty).filter(Boolean)));
              const displaySpecialties = uniqueDocSpecs.length > 0
                ? uniqueDocSpecs.join(' · ')
                : `${clinic.specialty} Specialist`;
              return <div className="hero-sub">{displaySpecialties}</div>;
            })()}
            <div style={{ marginTop: '6px' }}>
              {clinic.ratingCount === 0 ? (
                <span className="pill" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.9)', fontSize: '11px' }}>
                  New · No reviews yet
                </span>
              ) : (
                <span className="pill" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.9)', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => document.getElementById('reviews-section').scrollIntoView({ behavior: 'smooth' })}>
                  <span>{clinic.rating}</span>
                  <StarIcon size={12} fill="#FBBF24" stroke="#F59E0B" />
                  <span>· {clinic.ratingCount} reviews</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="stat-row" style={{ marginTop: '20px' }}>
          <div className="stat-box">
            <div className="stat-num">{booked}</div>
            <div className="stat-lbl">Booked today</div>
          </div>
          <div className="stat-box">
            <div className="stat-num" style={{ color: '#FBBF24' }}>
              {clinic.isUnavailable ? '-' : `${activeDoctorsCount} / ${totalDoctorsCount}`}
            </div>
            <div className="stat-lbl">Active Doctors</div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN RESPONSIVE GRID FOR CLINIC DETAILS */}
      <div className="detail-grid-wrap">
        {/* LEFT COLUMN: INFO & BOOKING CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ cursor: 'default', margin: 0, padding: '20px' }}>
            <div className="sec-label" style={{ marginTop: 0 }}>Clinic Info</div>
            <div className="ilist">
              <div className="irow" style={{ alignItems: 'flex-start' }}>
                <span className="ilabel" style={{ flexShrink: 0, width: '85px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Address
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flex: 1 }}>
                  <span className="ival" style={{ textAlign: 'right', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {clinic.address || 'Address not listed'}
                  </span>
                  {(() => {
                    const hasCoords = clinic.latitude && clinic.longitude;
                    const mapUrl = hasCoords
                      ? `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`
                      : (clinic.googleMapsUrl || (clinic.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address)}` : ''));

                    if (!mapUrl) return null;
                    return (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          color: '#ffffff',
                          textDecoration: 'none',
                          boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          cursor: 'pointer'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="3 11 22 2 13 21 11 13 3 11" />
                        </svg>
                        <span>Get Directions</span>
                        <span style={{ fontSize: '11px', opacity: 0.9 }}>↗</span>
                      </a>
                    );
                  })()}
                </div>
              </div>
              <div className="irow">
                <span className="ilabel">Fee</span>
                <span className="ival">₹{clinic.fee} consultation</span>
              </div>
              <div className="irow">
                <span className="ilabel" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Contact
                </span>
                {clinic.contact ? (
                  <a
                    href={`tel:${clinic.contact.replace(/[^0-9+]/g, '')}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--green-dark)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                    title="Click to call clinic"
                  >
                    <span>{clinic.contact}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        background: 'var(--green-light)',
                        color: 'var(--green-dark)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        border: '1px solid var(--green-mid)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      Call
                    </span>
                  </a>
                ) : (
                  <span className="ival" style={{ color: 'var(--text3)' }}>Not provided</span>
                )}
              </div>
            </div>
          </div>

          <div className="sec-label" style={{ margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
              <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
              <circle cx="20" cy="10" r="2" />
            </svg>
            Choose Doctor to Book Token
          </div>

          {(() => {
            if (clinicDoctors.length === 0) {
              return (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  No doctors registered yet. Please check back later!
                </div>
              );
            }

            return clinicDoctors.map((doc, idx) => {
              const totalConsultationsCount = bookings.filter(b =>
                b.clinicId === clinic._id &&
                b.doctorName === doc.name &&
                b.status !== 'cancelled'
              ).length;

              const todayBookingsCount = bookings.filter(b => {
                if (b.clinicId !== clinic._id || b.doctorName !== doc.name || b.status === 'cancelled') {
                  return false;
                }
                const bDate = new Date(b.createdAt);
                const today = new Date();
                return bDate.getDate() === today.getDate() &&
                  bDate.getMonth() === today.getMonth() &&
                  bDate.getFullYear() === today.getFullYear();
              }).length;

              const docWaitingCount = bookings.filter(b => {
                if (b.clinicId !== clinic._id || b.doctorName !== doc.name || b.status !== 'waiting' || isBookingExpired(b, doc.delayMinutes)) {
                  return false;
                }
                const bDate = new Date(b.createdAt);
                const today = new Date();
                return bDate.getDate() === today.getDate() &&
                  bDate.getMonth() === today.getMonth() &&
                  bDate.getFullYear() === today.getFullYear();
              }).length;

              const docWaitTime = docWaitingCount > 0
                ? `~${(docWaitingCount * 10) + (doc.delayMinutes || 0)}m`
                : 'Ready / No wait';

              const docReviews = reviews.filter(r => r.doctorName === doc.name);
              const docRatingCount = docReviews.length;
              const docRating = docRatingCount > 0
                ? (docReviews.reduce((sum, r) => sum + r.rating, 0) / docRatingCount).toFixed(1)
                : null;

              return (
                <div key={idx} className="card" style={{ cursor: 'default', margin: 0, padding: '16px', border: '1px solid var(--border)', borderRadius: '14px', transition: 'box-shadow 0.2s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{doc.name}</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocFilter(doc.name);
                            document.getElementById('reviews-section').scrollIntoView({ behavior: 'smooth' });
                          }}
                          style={{
                            fontSize: '11px',
                            color: docRatingCount > 0 ? 'var(--green-dark)' : 'var(--text3)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: docRatingCount > 0 ? 'var(--green-light)' : 'var(--surface2)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: docRatingCount > 0 ? '1px solid var(--green-mid)' : '1px solid var(--border)'
                          }}
                          title={docRatingCount > 0 ? "Click to view reviews for this doctor" : "No reviews for this doctor yet"}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          {docRatingCount > 0 ? `${docRating} (${docRatingCount})` : 'New'}
                        </span>
                      </div>
                      {(doc.qualification || doc.experience) && (
                        <div style={{ fontSize: '12px', color: 'var(--text2)', margin: '3px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {doc.qualification && <span>🎓 {doc.qualification}</span>}
                          {doc.qualification && doc.experience && <span>•</span>}
                          {doc.experience && <span>💼 {doc.experience}</span>}
                        </div>
                      )}
                      <div style={{ fontSize: '12.5px', color: 'var(--green-dark)', fontWeight: 600, margin: '2px 0' }}>
                        {doc.specialty} Specialist
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        <div style={{ fontSize: '11.5px', color: 'var(--text2)', fontWeight: 600, background: 'var(--surface2)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          🕒 {doc.timings} ({doc.session})
                        </div>
                        <span className="pill pg" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                          Consultations: {totalConsultationsCount}
                        </span>
                        <span className="pill" style={{
                          fontSize: '10.5px',
                          background: docWaitingCount > 0 ? 'var(--amber-light)' : 'var(--green-light)',
                          color: docWaitingCount > 0 ? 'var(--amber-dark)' : 'var(--green-dark)',
                          border: docWaitingCount > 0 ? '1px solid var(--amber)' : '1px solid var(--green-mid)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 600
                        }}>
                          Est. wait: {docWaitTime}
                        </span>
                      </div>
                      {doc.delayMinutes > 0 && (
                        <div style={{ color: 'var(--red)', fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>
                          ⏱️ Delayed by {doc.delayMinutes} mins
                        </div>
                      )}
                    </div>
                    <button
                      className="btn-p"
                      onClick={() => {
                        if (!currentUser) {
                          if (onRequireAuth) onRequireAuth(doc);
                        } else {
                          onStartBooking(doc);
                        }
                      }}
                      disabled={!isClinicOpen(clinic) || doc.isUnavailable || doc.isPaused}
                      style={{
                        opacity: (!isClinicOpen(clinic) || doc.isUnavailable || doc.isPaused) ? 0.5 : 1,
                        padding: '10px 28px',
                        fontSize: '14px',
                        minWidth: '100px',
                        width: 'auto',
                        marginTop: 0
                      }}
                    >
                      {!isClinicOpen(clinic) ? 'Closed' : doc.isUnavailable ? 'Offline' : doc.isPaused ? 'Paused' : 'Book'}
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* RIGHT COLUMN: QUEUE LIVE STATUS & REVIEWS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>


          <div id="reviews-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>


            <div className="sec-label" style={{ margin: '8px 0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Patient Reviews ({filteredReviews.length})</span>
              {selectedDocFilter && (
                <button
                  onClick={() => setSelectedDocFilter(null)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: 'var(--red)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontFamily: 'inherit'
                  }}
                >
                  Clear filter ({selectedDocFilter}) ✕
                </button>
              )}
            </div>

            {filteredReviews.length > 0 ? (
              <>
                {visibleReviews.map((rev, rIdx) => (
                  <div key={rIdx} className="card" style={{ cursor: 'default', margin: 0, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{rev.userName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ margin: '4px 0' }}>
                      <StarRatingRow rating={rev.rating} size={13} />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{rev.comment}</div>
                  </div>
                ))}
                {!showAllReviews && filteredReviews.length > 2 && (
                  <button
                    onClick={() => setShowAllReviews(true)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      padding: '10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      marginTop: '4px'
                    }}
                  >
                    Show more reviews ({filteredReviews.length - 2})
                  </button>
                )}
              </>
            ) : (
              <div style={{ padding: '16px', color: 'var(--text3)', fontSize: '13px', textAlign: 'center', background: 'var(--surface2)', borderRadius: '8px' }}>
                No reviews yet. Be the first to share your experience!
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}
