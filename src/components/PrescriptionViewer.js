import React, { useState } from 'react';

export default function PrescriptionViewer({ 
  booking, 
  clinic, 
  onClose, 
  onBookFollowUp 
}) {
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const cleanDocName = (rawName) => {
    if (!rawName) return 'Doctor';
    const clean = rawName.trim().replace(/^dr\.?\s+/i, '');
    return clean ? `Dr. ${clean}` : 'Doctor';
  };

  const doctorDisplayName = cleanDocName(booking.doctorName || clinic?.doctorName);
  const clinicDisplayName = clinic?.name || booking.clinicName || 'Medical Clinic';

  const rxDate = booking.prescriptionSentAt || booking.createdAt || new Date();
  const formattedDate = new Date(rxDate).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const formattedFollowUp = booking.followUpDate 
    ? new Date(booking.followUpDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  // Calculate days remaining for follow-up
  const daysToFollowUp = booking.followUpDate 
    ? Math.ceil((new Date(booking.followUpDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const handleShare = () => {
    const text = `Digital Prescription from ${doctorDisplayName} (${clinicDisplayName})\nPatient: ${booking.patientName}\nComplaint: ${booking.complaints?.join(', ') || booking.complaintDesc || 'General Visit'}\nDiagnosis: ${booking.clinicalNotes || 'General Consultation'}\nRx: ${booking.prescription || (booking.medicines?.map(m => m.name).join(', ') || 'Consultation advice')}\nFollow-up: ${formattedFollowUp || 'As advised'}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Prescription - ${booking.patientName}`,
        text: text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Check if free text prescription has multiple lines
  const rawPrescriptionText = (booking.prescription || '').trim();
  const prescriptionLines = rawPrescriptionText ? rawPrescriptionText.split('\n').filter(Boolean) : [];

  const patientComplaints = booking.complaints && booking.complaints.length > 0 
    ? booking.complaints.join(', ')
    : (booking.complaintDesc || 'General Checkup & Health Consultation');

  return (
    <div className="rx-modal-overlay" onClick={onClose}>
      <div className="rx-modal-sheet" onClick={(e) => e.stopPropagation()}>
        
        {/* Actions Bar (Top) */}
        <div className="rx-top-actions no-print">
          <button className="rx-action-btn" onClick={onClose}>
            ✕ Close
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="rx-action-btn share" onClick={handleShare}>
              {copied ? '✓ Copied' : '📤 Share'}
            </button>
            <button className="rx-action-btn print" onClick={() => window.print()}>
              🖨️ Print / PDF
            </button>
          </div>
        </div>

        {/* Prescription Document Slip */}
        <div className="rx-document-paper" id="printable-rx">
          
          {/* Header */}
          <div className="rx-doc-header">
            <div className="rx-clinic-meta">
              <div className="rx-clinic-name">{clinicDisplayName}</div>
              <div className="rx-clinic-sub">{clinic?.address || 'Tamil Nadu, India'}</div>
              {clinic?.contact && <div className="rx-clinic-sub">📞 Phone: {clinic.contact}</div>}
            </div>
            <div className="rx-badge-verified">
              <span>🩺 Verified e-Prescription</span>
            </div>
          </div>

          <div className="rx-divider"></div>

          {/* Doctor & Patient Info Bar */}
          <div className="rx-meta-grid">
            <div className="rx-meta-card">
              <div className="rx-label">Doctor</div>
              <div className="rx-value">{doctorDisplayName}</div>
              <div className="rx-sub-val">{clinic?.specialty || 'General Practitioner'}</div>
            </div>
            <div className="rx-meta-card">
              <div className="rx-label">Patient Details</div>
              <div className="rx-value">{booking.patientName || 'Patient'}</div>
              <div className="rx-sub-val">
                {booking.patientAge ? `${booking.patientAge} Yrs · ` : ''}
                {booking.patientGender === 'M' ? 'Male' : booking.patientGender === 'F' ? 'Female' : 'Patient'}
              </div>
            </div>
            <div className="rx-meta-card">
              <div className="rx-label">Token & Date</div>
              <div className="rx-value">Token #{booking.tokenNumber}</div>
              <div className="rx-sub-val">{formattedDate}</div>
            </div>
          </div>

          {/* TWO-COLUMN CLINICAL & PRESCRIPTION BODY */}
          <div className="rx-two-col-grid">
            
            {/* LEFT COLUMN: COMPLAINTS, DIAGNOSIS & CLINICAL NOTES */}
            <div className="rx-col-left">
              
              {/* 1. Patient Chief Complaint */}
              <div className="rx-card-subblock">
                <div className="rx-subblock-title">
                  <span>🤒</span> Chief Complaints & Symptoms
                </div>
                <div className="rx-subblock-content">
                  {patientComplaints}
                </div>
              </div>

              {/* 2. Doctor Diagnosis & Observations */}
              <div className="rx-card-subblock">
                <div className="rx-subblock-title">
                  <span>📋</span> Diagnosis & Clinical Observations
                </div>
                <div className="rx-subblock-content" style={{ borderColor: '#93C5FD', background: '#F0F9FF' }}>
                  <div style={{ color: '#0369A1', fontWeight: 700 }}>
                    {booking.clinicalNotes || 'Clinical evaluation completed'}
                  </div>
                </div>
              </div>

              {/* 3. Doctor Advice / Special Instructions */}
              {booking.followUpNotes && (
                <div className="rx-card-subblock">
                  <div className="rx-subblock-title">
                    <span>💡</span> Doctor&apos;s Advice & Instructions
                  </div>
                  <div className="rx-subblock-content" style={{ fontSize: '12.5px', color: '#475569' }}>
                    {booking.followUpNotes}
                  </div>
                </div>
              )}

              {/* 4. Vital / Health Notes */}
              {(booking.patientAge || booking.visitType) && (
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: 'auto', paddingTop: '8px' }}>
                  <span>Visit Type: <strong style={{ color: '#334155' }}>{booking.visitType === 'returning' ? 'Follow-up Consultation' : 'General Visit'}</strong></span>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: ℞ PRESCRIBED MEDICATIONS & TREATMENT */}
            <div className="rx-col-right">
              
              <div className="rx-sec-heading" style={{ marginBottom: '8px' }}>
                <span className="rx-symbol">℞</span>
                <span>Prescribed Medications & Dosage</span>
              </div>

              {/* Structured Medicines Table if present */}
              {booking.medicines && booking.medicines.length > 0 ? (
                <div className="rx-medicines-table-wrap">
                  <table className="rx-medicines-table">
                    <thead>
                      <tr>
                        <th style={{ width: '28px' }}>#</th>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Timing</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.medicines.map((med, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--text3)' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                            💊 {med.name}
                            {med.instructions && (
                              <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
                                {med.instructions}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="rx-dosage-badge">
                              {med.dosage || '1-0-1'}
                            </span>
                          </td>
                          <td>
                            <span className={`rx-timing-pill ${med.timing?.toLowerCase().includes('before') ? 'before' : 'after'}`}>
                              {med.timing || 'After Food'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#334155', fontSize: '11.5px' }}>{med.duration || '5 Days'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : rawPrescriptionText ? (
                /* Free-text prescription display */
                <div className="rx-text-card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {prescriptionLines.map((line, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                        <span style={{ fontSize: '18px' }}>💊</span>
                        <span style={{ background: '#F1F5F9', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', flex: 1 }}>
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rx-empty-box">
                  🩺 General medical consultation completed. Follow doctor&apos;s verbal healthcare instructions.
                </div>
              )}

              {/* Auto Follow-up Checkup Reminder Banner */}
              {formattedFollowUp && (
                <div className="rx-followup-card" style={{ margin: '14px 0 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>⏰</span>
                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#B45309', fontWeight: 700 }}>
                        Next Follow-up Checkup
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#92400E', marginTop: '1px' }}>
                        {formattedFollowUp}
                      </div>
                      {booking.followUpNotes && (
                        <div style={{ fontSize: '11.5px', color: '#78350F', marginTop: '3px' }}>
                          📋 Advice: {booking.followUpNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  {onBookFollowUp && (
                    <button 
                      className="rx-rebook-btn no-print"
                      onClick={() => onBookFollowUp(clinic, booking.doctorName)}
                      style={{ padding: '6px 14px', fontSize: '11.5px' }}
                    >
                      Book Token →
                    </button>
                  )}
                </div>
              )}

            </div>

          </div>

          {/* Footer Signature */}
          <div className="rx-doc-footer">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Generated electronically via TokenQ</div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>Secure Digital Health Record · Encrypted</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="rx-sig-line"></div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{doctorDisplayName}</div>
              <div style={{ fontSize: '10.5px', color: '#64748B' }}>Authorized Medical Practitioner</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
