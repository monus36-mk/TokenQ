import React, { useState } from 'react';

export default function BookingFlow({ clinic, onBack, onBookingComplete }) {
  const [step, setStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('7:00 AM');
  const [bookingFor, setBookingFor] = useState('self');
  const [patientName, setPatientName] = useState('Kavitha Rajan');
  const [patientAge, setPatientAge] = useState('34');
  const [patientGender, setPatientGender] = useState('M');
  const [patientPhone, setPatientPhone] = useState('+91 98765 43210');
  const [visitType, setVisitType] = useState('new');
  const [onMedication, setOnMedication] = useState('no');
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [complaintDesc, setComplaintDesc] = useState('');
  const [severity, setSeverity] = useState('Mild — manageable');
  const [upiProvider, setUpiProvider] = useState('gpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const slots = [
    { time: '6:00 AM', status: 'full', label: 'Full' },
    { time: '6:30 AM', status: 'full', label: 'Full' },
    { time: '7:00 AM', status: 'available', label: '3 left' },
    { time: '7:30 AM', status: 'available', label: '5 left' },
    { time: '8:00 AM', status: 'available', label: '7 left' },
    { time: '8:30 AM', status: 'available', label: '6 left' },
    { time: '9:00 AM', status: 'available', label: '8 left' },
    { time: '9:30 AM', status: 'available', label: '4 left' }
  ];

  const complaintsList = [
    'Fever', 'Cold / Cough', 'Headache', 'Body pain', 'Stomach ache',
    'Vomiting', 'Skin issue', 'Chest pain', 'Weakness', 'Follow-up', 'Routine checkup'
  ];

  const handleNext = () => {
    if (step < 5) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      onBack();
    } else {
      setStep(prev => prev - 1);
    }
  };

  const toggleComplaint = (complaint) => {
    setSelectedComplaints(prev => 
      prev.includes(complaint) 
        ? prev.filter(c => c !== complaint)
        : [...prev, complaint]
    );
  };

  const handlePayAndConfirm = async () => {
    setIsSubmitting(true);
    const fee = clinic.fee || 100;
    const totalPaid = fee + 5; // platform fee

    const bookingData = {
      clinicId: clinic._id,
      patientName,
      patientAge: parseInt(patientAge, 10),
      patientGender,
      patientPhone,
      visitType,
      medication: onMedication,
      complaints: selectedComplaints,
      describeComplaint: complaintDesc,
      severity,
      slot: selectedSlot,
      feePaid: totalPaid
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      const json = await res.json();
      if (json.success) {
        setConfirmedBooking(json.data);
        setStep(6); // Confirmation screen
        if (onBookingComplete) {
          onBookingComplete(json.data);
        }
      } else {
        alert('Booking failed: ' + json.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error confirming booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    'Select slot',
    'Who is this for?',
    'Patient details',
    'Complaint details',
    'Review booking',
    'Token Confirmed'
  ];

  // Helper calculation for Review step
  const fee = clinic.fee || 100;
  const total = fee + 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      
      {/* Top Navigation */}
      <div className="topbar">
        <div className="back-btn" onClick={step === 6 ? onBack : handleBack}>←</div>
        <div className="topbar-title">{stepTitles[step - 1]}</div>
        <div className="pill pg" style={{ fontSize: '11px' }}>🏥 Clinic</div>
      </div>

      {/* Progress Dots */}
      {step <= 5 && (
        <div className="step-bar">
          {[1, 2, 3, 4, 5].map(i => (
            <React.Fragment key={i}>
              <div className={`sdot ${i < step ? 'done' : i === step ? 'act' : 'idle'}`}>
                {i < step ? '✓' : i}
              </div>
              {i < 5 && <div className={`sline ${i < step ? 'done' : ''}`}></div>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Scrollable Form Body */}
      <div className="scrollable">
        <div className="pad">
          
          {/* STEP 1: Select slot */}
          {step === 1 && (
            <div className="bstep active">
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 13px', marginBottom: '16px', fontSize: '13px', color: 'var(--text2)' }}>
                🏥 {clinic.name} · {clinic.timings}
              </div>
              <div className="sec-label">Select time slot</div>
              <div className="slot-grid">
                {slots.map(s => {
                  const isFull = s.status === 'full';
                  const isSel = selectedSlot === s.time;
                  return (
                    <button
                      key={s.time}
                      className={`slot-btn ${isFull ? 'full' : ''} ${isSel ? 'sel' : ''}`}
                      disabled={isFull}
                      onClick={() => setSelectedSlot(s.time)}
                    >
                      {s.time}
                      <span className="slot-count">{s.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ height: '8px' }}></div>
              <button className="btn-p" onClick={handleNext}>Continue →</button>
            </div>
          )}

          {/* STEP 2: Who is this for */}
          {step === 2 && (
            <div className="bstep active">
              <div className="sec-label">Who are you booking for?</div>
              <div className="for-toggle">
                <div className={`for-btn ${bookingFor === 'self' ? 'sel' : ''}`} onClick={() => { setBookingFor('self'); setPatientName('Kavitha Rajan'); }}>
                  <span className="fi">🙋</span>Myself
                </div>
                <div className={`for-btn ${bookingFor === 'family' ? 'sel' : ''}`} onClick={() => { setBookingFor('family'); setPatientName(''); }}>
                  <span className="fi">👨‍👩‍👧</span>Family member
                </div>
                <div className={`for-btn ${bookingFor === 'other' ? 'sel' : ''}`} onClick={() => { setBookingFor('other'); setPatientName(''); }}>
                  <span className="fi">🤝</span>Someone else
                </div>
              </div>
              
              {bookingFor !== 'self' && (
                <div className="alert alert-a">
                  <span>👶</span>
                  <div className="alert-txt">
                    <strong>Booking for someone else</strong>
                    Fill their details in the next step. Token will be generated in their name.
                  </div>
                </div>
              )}
              
              <button className="btn-p" onClick={handleNext}>Continue →</button>
            </div>
          )}

          {/* STEP 3: Patient details */}
          {step === 3 && (
            <div className="bstep active">
              <div className="sec-label">Patient details</div>
              
              <div className="fg">
                <label className="fl">Full name</label>
                <input 
                  className="fi-input" 
                  type="text" 
                  value={patientName} 
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Kavitha Rajan"
                />
              </div>

              <div className="frow">
                <div className="fg">
                  <label className="fl">Age</label>
                  <input 
                    className="fi-input" 
                    type="number" 
                    value={patientAge} 
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="34"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Gender</label>
                  <div className="gender-toggle">
                    {['M', 'F', 'O'].map(g => (
                      <div 
                        key={g} 
                        className={`gbtn ${patientGender === g ? 'sel' : ''}`} 
                        onClick={() => setPatientGender(g)}
                      >
                        {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="fg">
                <label className="fl">Phone</label>
                <input 
                  className="fi-input" 
                  type="tel" 
                  value={patientPhone} 
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="fg">
                <label className="fl">Visit type</label>
                <select className="fi-select" value={visitType} onChange={(e) => setVisitType(e.target.value)}>
                  <option value="new">New patient</option>
                  <option value="returning">Returning patient</option>
                </select>
              </div>

              <div className="fg">
                <label className="fl">On any medication?</label>
                <select className="fi-select" value={onMedication} onChange={(e) => setOnMedication(e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes — will mention to doctor</option>
                </select>
              </div>

              <button className="btn-p" onClick={handleNext}>Continue →</button>
            </div>
          )}

          {/* STEP 4: Complaint */}
          {step === 4 && (
            <div className="bstep active">
              <div className="sec-label">Chief complaint</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>Select all that apply</div>
              
              <div className="chips">
                {complaintsList.map(comp => {
                  const isSel = selectedComplaints.includes(comp);
                  return (
                    <div 
                      key={comp} 
                      className={`chip ${isSel ? 'sel' : ''}`}
                      onClick={() => toggleComplaint(comp)}
                    >
                      {comp}
                    </div>
                  );
                })}
              </div>

              <div className="fg">
                <label className="fl">Describe (optional)</label>
                <textarea 
                  className="fi-textarea" 
                  value={complaintDesc} 
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  placeholder="e.g. Fever for 2 days, not eating well..."
                ></textarea>
              </div>

              <div className="fg">
                <label className="fl">Severity</label>
                <select className="fi-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option>Mild — manageable</option>
                  <option>Moderate — affecting daily routine</option>
                  <option>Severe — urgent attention needed</option>
                </select>
              </div>

              <button className="btn-p" onClick={handleNext}>Review booking →</button>
            </div>
          )}

          {/* STEP 5: Review booking */}
          {step === 5 && (
            <div className="bstep active">
              <div className="sec-label">Review your booking</div>
              
              <div className="rsum">
                <div className="rsum-title">🏥 Booking summary</div>
                <div className="rs-row">
                  <span className="rs-l">Place</span>
                  <span className="rs-v">{clinic.name}</span>
                </div>
                <div className="rs-row">
                  <span className="rs-l">Slot</span>
                  <span className="rs-v">{selectedSlot}</span>
                </div>
                <div className="rs-row">
                  <span className="rs-l">Name</span>
                  <span className="rs-v">{patientName || '—'}</span>
                </div>
                <div className="rs-row">
                  <span className="rs-l">Age / Gender</span>
                  <span className="rs-v">{patientAge || '—'} yrs · {patientGender === 'M' ? 'Male' : patientGender === 'F' ? 'Female' : 'Other'}</span>
                </div>
                <div className="rs-row">
                  <span className="rs-l">Phone</span>
                  <span className="rs-v">{patientPhone || '—'}</span>
                </div>
                <div className="rs-row">
                  <span className="rs-l">Visit type</span>
                  <span className="rs-v">{visitType === 'new' ? 'New patient' : 'Returning patient'}</span>
                </div>
                <div className="rs-row">
                  <span className="rs-l">Medication</span>
                  <span className="rs-v">{onMedication === 'yes' ? 'Yes' : 'No'}</span>
                </div>
                <div className="rs-row">
                  <span className="rs-l">Complaints</span>
                  <span className="rs-v" style={{ wordBreak: 'break-word' }}>
                    {selectedComplaints.join(', ') || 'None'} {complaintDesc ? `(${complaintDesc})` : ''}
                  </span>
                </div>
                <div className="rs-row">
                  <span className="rs-l">Severity</span>
                  <span className="rs-v">{severity}</span>
                </div>
              </div>

              <div className="sec-label">💰 Payment</div>
              <div className="ilist" style={{ marginBottom: '14px' }}>
                <div className="irow">
                  <span className="ilabel">Consultation fee</span>
                  <span className="ival">₹{fee}</span>
                </div>
                <div className="irow">
                  <span className="ilabel">Platform booking fee</span>
                  <span className="ival">₹5</span>
                </div>
              </div>

              <div className="pay-total">
                <div className="pay-total-lbl">Total to pay</div>
                <div className="pay-total-amt">₹{total}</div>
              </div>

              <div className="sec-label">Pay via UPI</div>
              <label className="upi-opt" onClick={() => setUpiProvider('gpay')}>
                <div className="upi-icon" style={{ background: '#E8F5E9' }}>🟢</div>
                <div className="upi-name">Google Pay</div>
                <input type="radio" name="upi" checked={upiProvider === 'gpay'} readOnly />
              </label>
              <label className="upi-opt" onClick={() => setUpiProvider('phonepe')}>
                <div className="upi-icon" style={{ background: '#F3E5F5' }}>🟣</div>
                <div className="upi-name">PhonePe</div>
                <input type="radio" name="upi" checked={upiProvider === 'phonepe'} readOnly />
              </label>
              <label className="upi-opt" onClick={() => setUpiProvider('paytm')}>
                <div className="upi-icon" style={{ background: '#E3F2FD' }}>🔵</div>
                <div className="upi-name">Paytm</div>
                <input type="radio" name="upi" checked={upiProvider === 'paytm'} readOnly />
              </label>

              <div style={{ height: '14px' }}></div>
              
              <button 
                className="btn-p" 
                onClick={handlePayAndConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Securing transaction...' : `🔒 Pay & confirm token (₹${total})`}
              </button>
              
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text3)', marginTop: '9px' }}>
                Secured by Razorpay · UPI encrypted
              </div>
            </div>
          )}

          {/* STEP 6: Live Queue Tracker (Token Confirmed) */}
          {step === 6 && confirmedBooking && (
            <div className="bstep active">
              <div className="token-hero">
                <div className="token-lbl">Your token</div>
                <div className="token-num" style={{ color: 'var(--green-mid)' }}>
                  {confirmedBooking.tokenNumber}
                </div>
                <div className="token-clinic">
                  {clinic.name} · {confirmedBooking.slot}
                </div>
                <div style={{ marginTop: '12px' }}>
                  <span className="pill" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.85)' }}>
                    ✅ ₹{confirmedBooking.feePaid} paid via UPI
                  </span>
                </div>
              </div>

              <div className="sec-label">Live queue tracker</div>
              <div className="qtracker">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Now serving</span>
                  <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Your token</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '11px' }}>
                  {/* Mock live serving sequence. Since this is Kavitha's token, serving is A-12, she is A-19. */}
                  <span className="qt-lbl" style={{ color: 'var(--green-dark)' }}>A-12</span>
                  <div className="qt-dots">
                    <div className="qt-dot done"></div>
                    <div className="qt-dot done"></div>
                    <div className="qt-dot cur"></div>
                    <div className="qt-dot"></div>
                    <div className="qt-dot"></div>
                    <div className="qt-dot"></div>
                    <div className="qt-dot"></div>
                  </div>
                  <span className="qt-lbl" style={{ color: 'var(--amber)' }}>{confirmedBooking.tokenNumber}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '9px', textAlign: 'center' }}>
                    <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>7</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>ahead</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '9px', textAlign: 'center' }}>
                    <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--amber)' }}>~35m</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>est. wait</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '9px', textAlign: 'center' }}>
                    <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--blue)' }}>6 min</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>to reach</div>
                  </div>
                </div>
              </div>

              <div className="alert alert-a">
                <span style={{ fontSize: '18px' }}>  🔔  </span>
                <div className="alert-txt">
                  <strong>Smart alert active</strong>
                  You'll be notified when 3 are ahead. Leave then — arrive just in time.
                </div>
              </div>
              <div className="alert alert-g">
                <span style={{ fontSize: '18px' }}>  ✅  </span>
                <div className="alert-txt">
                  <strong>Payment confirmed</strong>
                  Your slot is locked. Stay home, we'll alert you when it's your turn.
                </div>
              </div>

              <button className="btn-s" onClick={onBack}>← Back to home</button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
