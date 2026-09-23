import React, { useState } from 'react';
import PrescriptionViewer from './PrescriptionViewer';

export default function PatientPrescriptionsList({
  bookings,
  clinics,
  currentUser,
  onNavigate,
  onBookClinic
}) {
  const [selectedRxBooking, setSelectedRxBooking] = useState(null);

  // Filter bookings that have clinical entries, prescriptions, or follow-up dates
  const rxBookings = bookings
    .filter(b => Boolean(b.prescription || b.clinicalNotes || (b.medicines && b.medicines.length > 0) || b.followUpDate))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Upcoming follow-up checkups
  const upcomingFollowUps = rxBookings.filter(b => {
    if (!b.followUpDate) return false;
    const diff = new Date(b.followUpDate) - new Date();
    // within past 2 days or anytime in future
    return diff >= - (2 * 24 * 60 * 60 * 1000);
  });

  const handleBookFollowUp = (clinic, doctorName) => {
    if (onBookClinic) {
      onBookClinic(clinic, doctorName);
    }
  };

  const formatDoctorName = (raw) => {
    if (!raw) return 'Doctor';
    const clean = raw.trim().replace(/^dr\.?\s+/i, '');
    return clean ? `Dr. ${clean}` : 'Doctor';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '0 16px' }}>
      
      {/* Top Header */}
      <div className="topbar">
        <div className="topbar-title">Medical Prescriptions & Rx</div>
        <span className="pill pg" style={{ fontSize: '11px' }}>
          {rxBookings.length} {rxBookings.length === 1 ? 'Record' : 'Records'}
        </span>
      </div>

      <div className="scrollable">
        <div className="pad">

          {/* Auto Checkup Reminder Highlights Banner */}
          {upcomingFollowUps.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div className="sec-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⏰</span>
                <span>Scheduled Follow-up Checkup Reminders</span>
              </div>

              {upcomingFollowUps.map(b => {
                const clinic = clinics.find(c => String(c._id) === String(b.clinicId)) || {};
                const daysLeft = Math.ceil((new Date(b.followUpDate) - new Date()) / (1000 * 60 * 60 * 24));
                const isDueToday = daysLeft === 0;
                const isOverdue = daysLeft < 0;

                return (
                  <div 
                    key={`followup-${b._id}`}
                    className="followup-alert-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="followup-bell-icon">
                          🔔
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                            Follow-up with {formatDoctorName(b.doctorName)}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '1px' }}>
                            {clinic.name || 'Clinic'} · {new Date(b.followUpDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      <span className={`pill ${isOverdue ? 'pr' : isDueToday ? 'pa' : 'pg'}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                        {isOverdue ? 'Overdue' : isDueToday ? 'Due Today!' : `In ${daysLeft} days`}
                      </span>
                    </div>

                    {b.followUpNotes && (
                      <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '8px', background: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: '6px' }}>
                        <strong>Doctor&apos;s Advice:</strong> {b.followUpNotes}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        className="btn-p"
                        style={{ flex: 1, padding: '8px', fontSize: '12px', background: 'var(--green-dark)' }}
                        onClick={() => handleBookFollowUp(clinic, b.doctorName)}
                      >
                        Book Checkup Token →
                      </button>
                      <button
                        className="btn-s"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                        onClick={() => setSelectedRxBooking(b)}
                      >
                        View Rx 📄
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* All Prescriptions List */}
          <div className="sec-label">All Digital Prescriptions</div>

          {!currentUser ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius)', color: 'var(--text2)' }}>
              <span style={{ fontSize: '42px', display: 'block', marginBottom: '12px' }}>🔐</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Sign In to View Prescriptions</div>
              <div style={{ fontSize: '13px', marginTop: '6px', maxWidth: '340px', margin: '6px auto 16px', lineHeight: 1.5 }}>
                Your digital prescriptions, medicine dosages, and checkup reminders are securely linked to your account.
              </div>
              <button
                className="btn-p"
                style={{ padding: '10px 24px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer', display: 'inline-block' }}
                onClick={() => onNavigate && onNavigate('auth')}
              >
                Sign In / Register →
              </button>
            </div>
          ) : rxBookings.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius)', color: 'var(--text2)' }}>
              <span style={{ fontSize: '38px', display: 'block', marginBottom: '10px' }}>📋</span>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>No digital prescriptions yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px', maxWidth: '280px', margin: '4px auto 0' }}>
                When your doctor sends your digital Rx, clinical diagnosis, or medicines, it will automatically appear here.
              </div>
            </div>
          ) : (
            rxBookings.map((b, idx) => {
              const clinic = clinics.find(c => String(c._id) === String(b.clinicId)) || {};
              const rxDate = b.prescriptionSentAt || b.createdAt;
              const dateStr = new Date(rxDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div 
                  key={b._id ? `rx-list-${b._id}-${idx}` : `rx-list-${idx}`}
                  className="card"
                  style={{
                    marginBottom: '14px',
                    border: '1.5px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: '16px'
                  }}
                  onClick={() => setSelectedRxBooking(b)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                        🩺
                      </div>
                      <div>
                        <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' }}>
                          {formatDoctorName(b.doctorName)}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text2)' }}>
                          {clinic.name || 'Clinic'} · {dateStr}
                        </div>
                      </div>
                    </div>
                    <span className="pill pg" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Token #{b.tokenNumber}
                    </span>
                  </div>

                  {/* 2-COLUMN SPLIT PREVIEW: LEFT (Complaint & Diagnosis) | RIGHT (Prescription) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '10px',
                    background: 'var(--surface2)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    {/* LEFT COLUMN: Complaint & Diagnosis */}
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase' }}>
                        🤒 Complaint & Diagnosis:
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0369a1', marginTop: '2px' }}>
                        {b.clinicalNotes || b.complaints?.join(', ') || b.complaintDesc || 'General consultation completed'}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Prescription */}
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--green-dark)', textTransform: 'uppercase' }}>
                        ℞ Prescribed Medications:
                      </div>
                      {b.medicines && b.medicines.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                          {b.medicines.slice(0, 3).map((m, i) => (
                            <span key={i} className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--green-dark)', fontSize: '11px', fontWeight: 600 }}>
                              💊 {m.name} ({m.dosage || '1-0-1'})
                            </span>
                          ))}
                          {b.medicines.length > 3 && (
                            <span className="pill" style={{ background: 'white', color: 'var(--text2)', fontSize: '11px' }}>
                              +{b.medicines.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : b.prescription ? (
                        <div style={{ fontSize: '12px', color: 'var(--green-dark)', fontWeight: 600, marginTop: '2px' }}>
                          💊 {b.prescription}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                          General health advice
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Follow-up banner if present */}
                  {b.followUpDate && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ color: '#B45309', fontWeight: 600 }}>
                        ⏰ Next Follow-up: {new Date(b.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ color: 'var(--green-dark)', fontWeight: 700 }}>
                        View Full Rx Slip →
                      </span>
                    </div>
                  )}

                  {!b.followUpDate && (
                    <div style={{ marginTop: '6px', textAlign: 'right', fontSize: '11.5px', color: 'var(--green-dark)', fontWeight: 600 }}>
                      View Full Rx Slip →
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div style={{ height: '30px' }}></div>
        </div>
      </div>

      {/* Prescription Modal Popup */}
      {selectedRxBooking && (
        <PrescriptionViewer
          booking={selectedRxBooking}
          clinic={clinics.find(c => String(c._id) === String(selectedRxBooking.clinicId))}
          onClose={() => setSelectedRxBooking(null)}
          onBookFollowUp={(clinic, doctorName) => {
            setSelectedRxBooking(null);
            handleBookFollowUp(clinic, doctorName);
          }}
        />
      )}

    </div>
  );
}
