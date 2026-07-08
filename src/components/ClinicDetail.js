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

export default function ClinicDetail({ clinic, onBack, onStartBooking, currentUser, onReviewAdded }) {
  const booked = clinic.bookedCount || 0;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return alert('Please enter a comment.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/clinics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addReview',
          clinicId: clinic._id,
          review: {
            userName: currentUser?.name || 'Anonymous Patient',
            rating,
            comment
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        onReviewAdded(json.data);
        setComment('');
        setRating(5);
        alert('Thank you! Review added successfully.');
      } else {
        alert('Failed to submit review: ' + json.error);
      }
    } catch (err) {
      alert('Error submitting review: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px', overflowY: 'auto', maxHeight: '100vh' }}>
      
      {/* HERO (detail page) */}
      <div className="hero" style={{ borderRadius: 'var(--radius)', marginBottom: '24px' }}>
        <div className="topbar" style={{ background: 'transparent', border: 'none', padding: '0 0 13px', color: 'white' }}>
          <div className="back-btn" style={{ background: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.2)', color: 'white' }} onClick={onBack}>←</div>
          <div className="topbar-title" style={{ color: 'white' }}>Clinic details</div>
          <span className={`pill ${!isClinicOpen(clinic) ? 'pr' : 'pg'}`} style={{ fontSize: '11px' }}>
            {!isClinicOpen(clinic) ? 'Closed' : 'Open'}
          </span>
        </div>
        <div className="hero-row">
          <div className="hero-icon">{clinic.icon || '🏥'}</div>
          <div>
            <div className="hero-name">{clinic.name}</div>
            <div className="hero-sub">{clinic.doctorName} · {clinic.specialty} Specialist</div>
            <div style={{ marginTop: '6px' }}>
              {clinic.ratingCount === 0 ? (
                <span className="pill" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.9)', fontSize: '11px' }}>
                  New · No reviews yet
                </span>
              ) : (
                <span className="pill" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.9)', fontSize: '11px' }}>
                  {clinic.rating} ⭐ · {clinic.ratingCount} reviews
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
              {clinic.isUnavailable ? '-' : (clinic.delayMinutes > 0 ? `~${45 + clinic.delayMinutes}m` : clinic.avgWaitTime)}
            </div>
            <div className="stat-lbl">Est. wait</div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN RESPONSIVE GRID FOR CLINIC DETAILS */}
      <div className="detail-grid-wrap">
        {/* LEFT COLUMN: INFO & BOOKING CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ cursor: 'default', margin: 0, padding: '20px' }}>
            <div className="sec-label" style={{ marginTop: 0 }}>📍 Clinic Info</div>
            <div className="ilist">
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
          </div>

          <div className="sec-label" style={{ margin: '8px 0 0' }}>👨‍⚕️ Choose Doctor to Book Token</div>
          
          {(() => {
            const clinicDoctors = clinic.doctors && clinic.doctors.length > 0
              ? clinic.doctors
              : (clinic.doctorName ? [{ name: clinic.doctorName, specialty: clinic.specialty, timings: clinic.timings, session: 'Morning', isUnavailable: false, isPaused: false }] : []);
            
            if (clinicDoctors.length === 0) {
              return (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  👨‍⚕️ No doctors registered yet. Please check back later!
                </div>
              );
            }

            return clinicDoctors.map((doc, idx) => (
              <div key={idx} className="card" style={{ cursor: 'default', margin: 0, padding: '15px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{doc.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', margin: '2px 0' }}>
                      🎓 {doc.specialty} Specialist
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--green-dark)', fontWeight: 600 }}>
                      ⏰ {doc.timings} ({doc.session})
                    </div>
                    {doc.delayMinutes > 0 && (
                      <div style={{ color: 'var(--red)', fontSize: '11px', fontWeight: 500, marginTop: '3px' }}>
                        ⏱️ Delayed by {doc.delayMinutes} mins
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn-p" 
                    onClick={() => onStartBooking(doc)}
                    disabled={!isClinicOpen(clinic) || doc.isUnavailable || doc.isPaused}
                    style={{ 
                      opacity: (!isClinicOpen(clinic) || doc.isUnavailable || doc.isPaused) ? 0.5 : 1, 
                      padding: '8px 14px', 
                      fontSize: '12px', 
                      width: 'auto', 
                      marginTop: 0 
                    }}
                  >
                    {!isClinicOpen(clinic) ? 'Closed' : doc.isUnavailable ? 'Offline' : doc.isPaused ? 'Paused' : 'Book'}
                  </button>
                </div>
              </div>
            ));
          })()}
        </div>

        {/* RIGHT COLUMN: QUEUE LIVE STATUS & REVIEWS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ cursor: 'default', margin: 0, padding: '20px' }}>
            <div className="sec-label" style={{ marginTop: 0 }}>Live Queue Status</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6' }}>
              <div>• Total patient bookings today: <strong>{booked}</strong></div>
              <div style={{ marginTop: '4px' }}>• Average wait time: <strong>{clinic.avgWaitTime}</strong></div>
              {clinic.delayMinutes > 0 && (
                <div style={{ color: 'var(--red)', fontWeight: 500, marginTop: '8px' }}>
                  ⚠️ Doctor delayed by {clinic.delayMinutes} mins. Wait times adjusted.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="sec-label" style={{ margin: '0 0 4px' }}>Patient Reviews ({clinic.reviews?.length || 0})</div>
            
            {clinic.reviews && clinic.reviews.length > 0 ? (
              clinic.reviews.map((rev, rIdx) => (
                <div key={rIdx} className="card" style={{ cursor: 'default', margin: 0, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{rev.userName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#F59E0B', margin: '3px 0' }}>
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{rev.comment}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', color: 'var(--text3)', fontSize: '13px', textAlign: 'center', background: 'var(--surface2)', borderRadius: '8px' }}>
                No reviews yet. Be the first to share your experience!
              </div>
            )}

            {/* Write a Review Box */}
            <div className="card" style={{ cursor: 'default', margin: '10px 0 0', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Write a Review</div>
              <form onSubmit={handleSubmitReview}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text2)', display: 'block', marginBottom: '4px' }}>Rating:</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span 
                        key={star} 
                        onClick={() => setRating(star)} 
                        style={{ cursor: 'pointer', fontSize: '22px', color: star <= rating ? '#F59E0B' : '#D1D5DB', transition: 'color 0.15s' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text2)', display: 'block', marginBottom: '4px' }}>Comment:</label>
                  <textarea 
                    placeholder="Share your clinic visit experience..." 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '8px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: 'var(--text)',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-p" 
                  disabled={submitting} 
                  style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', margin: 0 }}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
