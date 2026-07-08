import React, { useState, useEffect } from 'react';

export default function BookingFlow({ clinic, doctor, onBack, onBookingComplete, currentUser }) {
  const [step, setStep] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState(doctor ? `${doctor.timings} (${doctor.session})` : (clinic.timings || 'Session'));
  const [bookingFor, setBookingFor] = useState('self');
  const [patientName, setPatientName] = useState(currentUser?.name || 'Kavitha Rajan');
  const [patientAge, setPatientAge] = useState(currentUser?.age?.toString() || '34');
  const [patientGender, setPatientGender] = useState(currentUser?.gender || 'F');
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [visitType, setVisitType] = useState('new');
  const [onMedication, setOnMedication] = useState('no');
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [complaintDesc, setComplaintDesc] = useState('');
  const [severity, setSeverity] = useState('Mild — manageable');
  const [upiProvider, setUpiProvider] = useState('gpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Payment Simulation States
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card'
  const [paymentSubStep, setPaymentSubStep] = useState('review'); // 'review', 'upi_pin', 'card_form', 'bank_otp', 'processing', 'success'
  const [upiPin, setUpiPin] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(currentUser?.name || '');
  const [bankOtp, setBankOtp] = useState('');
  const [generatedBankOtp, setGeneratedBankOtp] = useState('');
  const [showBankSms, setShowBankSms] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Connecting to Bank...');

  // Reset inputs when bookingFor changes
  useEffect(() => {
    if (bookingFor === 'self') {
      setPatientName(currentUser?.name || 'Kavitha Rajan');
      setPatientAge(currentUser?.age?.toString() || '34');
      setPatientGender(currentUser?.gender || 'F');
      setPatientPhone(currentUser?.phone || '+91 98765 43210');
    } else {
      setPatientName('');
      setPatientAge('');
      setPatientGender('M');
      setPatientPhone('');
    }
  }, [bookingFor, currentUser]);

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
    if (step === 5 && paymentSubStep !== 'review') {
      // Go backward in payment sub-steps
      if (paymentSubStep === 'upi_pin' || paymentSubStep === 'card_form') {
        setPaymentSubStep('review');
      } else if (paymentSubStep === 'bank_otp') {
        setPaymentSubStep('card_form');
        setShowBankSms(false);
      }
      return;
    }
    
    if (step === 2) {
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

  const handleCardNumberChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    let formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    let formatted = raw;
    if (raw.length > 2) {
      formatted = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(formatted);
  };

  // UPI PIN Keypad Logic
  const handleKeypadPress = (val) => {
    if (val === 'delete') {
      setUpiPin(prev => prev.slice(0, -1));
    } else if (val === 'confirm') {
      if (upiPin.length === 4) {
        handleUpiSubmit();
      }
    } else {
      if (upiPin.length < 4) {
        setUpiPin(prev => prev + val);
      }
    }
  };

  const handleUpiSubmit = () => {
    setPaymentSubStep('processing');
    setProcessingMessage('Validating UPI PIN...');
    setTimeout(() => {
      setProcessingMessage('Securing transaction with Razorpay...');
      setTimeout(() => {
        submitBooking('UPI');
      }, 1200);
    }, 1200);
  };

  const handleConfirmDirectBooking = () => {
    setPaymentSubStep('processing');
    setProcessingMessage('Creating your booking token...');
    setTimeout(() => {
      submitBooking('Direct');
    }, 1200);
  };

  const handleCardFormSubmit = (e) => {
    e.preventDefault();
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length !== 16) {
      alert('Please enter a valid 16-digit card number');
      return;
    }
    if (cardExpiry.length !== 5) {
      alert('Please enter a valid expiry date (MM/YY)');
      return;
    }
    if (cardCvv.length !== 3) {
      alert('Please enter a valid 3-digit CVV number');
      return;
    }
    if (!cardName.trim()) {
      alert('Please enter the cardholder\'s name');
      return;
    }

    // Trigger Bank OTP simulation
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedBankOtp(generated);
    setPaymentSubStep('bank_otp');
    setShowBankSms(true);
  };

  const handleBankOtpSubmit = (e) => {
    e.preventDefault();
    if (bankOtp !== generatedBankOtp && bankOtp !== '123456') { // 123456 as backup OTP
      alert('Incorrect OTP code. Please check the SMS banner at the top.');
      return;
    }
    setShowBankSms(false);
    setPaymentSubStep('processing');
    setProcessingMessage('Authorizing card transaction...');
    setTimeout(() => {
      setProcessingMessage('Locking your booking slot...');
      setTimeout(() => {
        submitBooking('Card');
      }, 1000);
    }, 1200);
  };

  const submitBooking = async (type) => {
    setIsSubmitting(true);
    const fee = clinic.fee || 100;
    const totalPaid = fee + 5; // platform fee

    const bookingData = {
      clinicId: clinic._id,
      doctorName: doctor ? doctor.name : (clinic.doctorName || 'Doctor'),
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
      feePaid: fee,
      userId: currentUser?._id
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
        setPaymentSubStep('success');
      } else {
        alert('Booking failed: ' + json.error);
        setPaymentSubStep('review');
      }
    } catch (e) {
      console.error(e);
      alert('Error confirming booking');
      setPaymentSubStep('review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close SMS banner
  useEffect(() => {
    if (showBankSms) {
      const timer = setTimeout(() => {
        setShowBankSms(false);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [showBankSms]);

  const stepTitles = [
    'Select slot',
    'Who is this for?',
    'Patient details',
    'Complaint details',
    'Review booking',
    'Token Confirmed'
  ];

  const fee = clinic.fee || 100;
  const total = fee + 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}>
      
      {/* BANK SMS BANNER */}
      {showBankSms && (
        <div className="sms-banner" onClick={() => setBankOtp(generatedBankOtp)} style={{ cursor: 'pointer' }}>
          <div className="sms-icon" style={{ background: '#1E3A8A' }}>🏦</div>
          <div className="sms-body">
            <div className="sms-title">SecureBank · Now</div>
            <div className="sms-text">
              OTP: Use <strong>{generatedBankOtp}</strong> for ₹{total} transaction. Tap to autofill.
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <div className="topbar">
        <div 
          className="back-btn" 
          onClick={step === 6 || paymentSubStep === 'success' ? onBack : handleBack}
          style={{ opacity: (paymentSubStep === 'processing') ? 0.3 : 1, pointerEvents: (paymentSubStep === 'processing') ? 'none' : 'auto' }}
        >
          ←
        </div>
        <div className="topbar-title">
          {paymentSubStep === 'success' ? 'Booking Confirmed' : paymentSubStep === 'processing' ? 'Processing Pay' : paymentSubStep === 'upi_pin' ? 'UPI PIN Secure' : paymentSubStep === 'card_form' ? 'Enter Card' : paymentSubStep === 'bank_otp' ? 'Bank Verification' : stepTitles[step - 1]}
        </div>
        <div className="pill pg" style={{ fontSize: '11px' }}>🏥 Clinic</div>
      </div>

      {/* Progress Dots */}
      {step <= 5 && paymentSubStep === 'review' && (
        <div className="step-bar">
          {[2, 3, 4, 5].map(i => (
            <React.Fragment key={i}>
              <div className={`sdot ${i < step ? 'done' : i === step ? 'act' : 'idle'}`}>
                {i < step ? '✓' : i - 1}
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
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 13px', marginBottom: '16px', fontSize: '13px', color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>🏥 <strong>Clinic:</strong> {clinic.name}</div>
                {doctor ? (
                  <>
                    <div>👨‍⚕️ <strong>Doctor:</strong> {doctor.name} ({doctor.specialty})</div>
                    <div>⏰ <strong>Session:</strong> {doctor.timings} ({doctor.session})</div>
                  </>
                ) : (
                  <div>⏰ <strong>Timings:</strong> {clinic.timings}</div>
                )}
              </div>
              <div className="sec-label">Select time slot</div>
              <div className="slot-grid">
                {slots.map(s => {
                  const isFull = s.status === 'full';
                  const isSel = selectedSlot === s.time;
                  return (
                    <button
                      key={s.time}
                      type="button"
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
                <div className={`for-btn ${bookingFor === 'self' ? 'sel' : ''}`} onClick={() => setBookingFor('self')}>
                  <span className="fi">🙋</span>Myself
                </div>
                <div className={`for-btn ${bookingFor === 'family' ? 'sel' : ''}`} onClick={() => setBookingFor('family')}>
                  <span className="fi">👨‍👩‍👧</span>Family member
                </div>
                <div className={`for-btn ${bookingFor === 'other' ? 'sel' : ''}`} onClick={() => setBookingFor('other')}>
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

          {/* STEP 5: REVIEW & PAYMENT FLOwS */}
          {step === 5 && (
            <div>
              {/* SUB-STEP: Review booking */}
              {paymentSubStep === 'review' && (
                <div className="bstep active">
                  <div className="sec-label">Review your booking</div>
                  
                  <div className="rsum">
                    <div className="rsum-title">🏥 Booking summary</div>
                    <div className="rs-row">
                      <span className="rs-l">Place</span>
                      <span className="rs-v">{clinic.name}</span>
                    </div>
                    <div className="rs-row">
                      <span className="rs-l">Doctor</span>
                      <span className="rs-v">{doctor ? doctor.name : (clinic.doctorName || '—')}</span>
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

                  <div style={{ height: '20px' }}></div>
                  
                  <button 
                    type="button"
                    className="btn-p" 
                    onClick={handleConfirmDirectBooking}
                  >
                    ✓ Confirm Booking (Get Token)
                  </button>
                  
                  <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text3)', marginTop: '9px' }}>
                    Instant activation · Secure clinical queuing
                  </div>
                </div>
              )}

              {/* SUB-STEP: UPI PIN ENTRY */}
              {paymentSubStep === 'upi_pin' && (
                <div className="bstep active" style={{ textAlign: 'center' }}>
                  <div style={{ background: '#1E3A8A', color: 'white', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '18px', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    🔒 Razorpay UPI Secure Checkout
                  </div>

                  <div style={{ fontSize: '14px', color: 'var(--text2)' }}>Paying to</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginTop: '3px' }}>TokenQ · {clinic.name}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, margin: '14px 0', color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>
                    ₹{total}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Enter 4-Digit UPI PIN
                    </div>
                    
                    <div className="pin-dots">
                      {[0, 1, 2, 3].map(index => (
                        <div key={index} className={`pin-dot ${index < upiPin.length ? 'filled' : ''}`}></div>
                      ))}
                    </div>

                    <div className="pin-grid">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} type="button" className="pin-btn" onClick={() => handleKeypadPress(num.toString())}>
                          {num}
                        </button>
                      ))}
                      <button type="button" className="pin-btn" onClick={() => handleKeypadPress('delete')} style={{ fontSize: '15px' }}>
                        ⌫
                      </button>
                      <button type="button" className="pin-btn" onClick={() => handleKeypadPress('0')}>
                        0
                      </button>
                      <button 
                        type="button" 
                        className="pin-btn" 
                        onClick={() => handleKeypadPress('confirm')} 
                        style={{ color: 'var(--green)', fontSize: '18px', background: 'var(--green-light)', borderColor: 'var(--green-mid)' }}
                        disabled={upiPin.length !== 4}
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-STEP: CARD FORM */}
              {paymentSubStep === 'card_form' && (
                <div className="bstep active">
                  <div className="credit-card">
                    <div className="cc-brand">
                      <span>TokenQ Checkout</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Card'}
                      </span>
                    </div>
                    <div className="cc-chip"></div>
                    <div className="cc-number">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="cc-info">
                      <div>
                        <div>Card Holder</div>
                        <div className="cc-val" style={{ width: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cardName || 'YOUR NAME'}
                        </div>
                      </div>
                      <div>
                        <div>Expires</div>
                        <div className="cc-val">{cardExpiry || 'MM/YY'}</div>
                      </div>
                      <div>
                        <div>CVV</div>
                        <div className="cc-val">{cardCvv ? '•••' : '000'}</div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleCardFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="fg">
                      <label className="fl">Card Number</label>
                      <input 
                        type="tel"
                        className="fi-input"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        required
                      />
                    </div>

                    <div className="fg">
                      <label className="fl">Cardholder Name</label>
                      <input 
                        type="text"
                        className="fi-input"
                        placeholder="Kavitha Rajan"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="frow">
                      <div className="fg">
                        <label className="fl">Expiry Date</label>
                        <input 
                          type="tel"
                          className="fi-input"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={handleCardExpiryChange}
                          required
                        />
                      </div>
                      <div className="fg">
                        <label className="fl">CVV</label>
                        <input 
                          type="password"
                          className="fi-input"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          required
                          maxLength={3}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-p" style={{ marginTop: '8px' }}>
                      🔒 Pay ₹{total} securely
                    </button>
                  </form>
                </div>
              )}

              {/* SUB-STEP: BANK OTP MODAL OVERLAY */}
              {paymentSubStep === 'bank_otp' && (
                <div className="modal-overlay">
                  <div className="bank-modal">
                    <div className="bank-header">
                      <span>🏦 Bank Secure Verification</span>
                    </div>
                    <form onSubmit={handleBankOtpSubmit} className="bank-body">
                      <div className="bank-title">Verify Transaction</div>
                      <div className="bank-desc">
                        A 3D Secure verification code has been sent to your cardholder mobile number. Enter the OTP code below to confirm payment of <strong>₹{total}</strong> to TokenQ.
                      </div>
                      
                      <div className="fg">
                        <input 
                          type="text"
                          className="fi-input"
                          placeholder="Enter 6-Digit OTP"
                          value={bankOtp}
                          onChange={(e) => setBankOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px', fontWeight: 600, fontFamily: "'DM Mono', monospace" }}
                          maxLength={6}
                          required
                          autoFocus
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button 
                          type="button" 
                          className="btn-s" 
                          onClick={() => setPaymentSubStep('card_form')}
                          style={{ flex: 1, padding: '9px' }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn-p" 
                          style={{ flex: 1, padding: '9px', background: 'var(--blue)' }}
                        >
                          Submit OTP
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* SUB-STEP: PROCESSING SCREEN */}
              {paymentSubStep === 'processing' && (
                <div className="bstep active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', textAlign: 'center' }}>
                  <div className="pulse-glow" style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: '32px' }}>🔒</span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                    {processingMessage}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '6px' }}>
                    Do not close the page or press back.
                  </div>
                </div>
              )}

              {/* SUB-STEP: SUCCESS SCREEN */}
              {paymentSubStep === 'success' && confirmedBooking && (
                <div className="bstep active" style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div className="success-checkmark">
                    <svg className="success-checkmark-svg" viewBox="0 0 52 52" style={{ width: '80px', height: '80px' }}>
                      <circle className="checkmark-circle" cx="26" cy="26" r="25" />
                      <path className="checkmark-kick" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                  </div>

                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green-dark)' }}>
                    Booking Confirmed!
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                    Your token slot has been locked successfully.
                  </div>

                  <div className="token-hero" style={{ borderRadius: 'var(--radius)', marginTop: '20px', padding: '20px 16px' }}>
                    <div className="token-lbl">Your Generated Token</div>
                    <div className="token-num" style={{ color: 'var(--green-mid)', fontSize: '50px' }}>
                      {confirmedBooking.tokenNumber}
                    </div>
                    <div className="token-clinic">
                      {clinic.name} · {confirmedBooking.slot}
                    </div>
                  </div>

                  <div className="alert alert-g" style={{ marginTop: '16px', textAlign: 'left' }}>
                    <span>🔔</span>
                    <div className="alert-txt">
                      <strong>Booking Activated Successfully</strong>
                      Your token is ready. We will notify you via SMS when 3 ahead.
                    </div>
                  </div>

                  <button 
                    type="button"
                    className="btn-p" 
                    style={{ marginTop: '24px' }}
                    onClick={() => {
                      if (onBookingComplete) {
                        onBookingComplete(confirmedBooking);
                      }
                    }}
                  >
                    Track Live Queue →
                  </button>
                </div>
              )}

            </div>
          )}

          {/* STEP 6: Backup Confirmation screen */}
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
                    ✅ Token Booking Confirmed
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
                  <strong>Slot confirmed successfully</strong>
                  Your token is locked. Stay home, we'll alert you when it's your turn.
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
