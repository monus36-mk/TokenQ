import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ clinics, bookings, onRefresh, onLogout, currentUser }) {
  const isClinicAdmin = currentUser?.role === 'clinic-admin';
  const defaultClinicId = isClinicAdmin ? (currentUser?.clinicId || '') : (clinics[0]?._id || '');

  const getWhatsAppLink = (phone, patientName, tokenNumber) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = `Hello ${patientName}, this is ${clinic.name || 'the clinic'}. Your token (${tokenNumber}) is coming up next in the queue. Please reach the consulting room. Thank you!`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };
  
  const [selectedClinicId, setSelectedClinicId] = useState(defaultClinicId);
  const [activeTab, setActiveTab] = useState(isClinicAdmin ? 'queue' : 'add-clinic');
  const [viewingPatient, setViewingPatient] = useState(null);

  const [editAddress, setEditAddress] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editContact, setEditContact] = useState('');
  const [loadedClinicId, setLoadedClinicId] = useState(null);

  useEffect(() => {
    const activeClinic = clinics.find(c => c._id === selectedClinicId) || clinics[0];
    if (activeClinic && activeClinic._id !== loadedClinicId) {
      setEditAddress(activeClinic.address || '');
      setEditFee(activeClinic.fee?.toString() || '');
      setEditContact(activeClinic.contact || '');
      setLoadedClinicId(activeClinic._id);
    }
  }, [selectedClinicId, clinics, loadedClinicId]);

  // Update selectedClinicId if default clinic loaded dynamically
  useEffect(() => {
    if (isClinicAdmin && currentUser?.clinicId) {
      setSelectedClinicId(currentUser.clinicId);
    } else if (!selectedClinicId && clinics.length > 0) {
      setSelectedClinicId(clinics[0]._id);
    }
  }, [currentUser, clinics, isClinicAdmin, selectedClinicId]);

  const [filterDoctor, setFilterDoctor] = useState('All');
  const [formDoctors, setFormDoctors] = useState([
    { name: '', specialty: 'General', timings: '9:00 AM – 1:00 PM', session: 'Morning' }
  ]);
  const [newDoc, setNewDoc] = useState({ name: '', specialty: 'General', session: 'Morning', timings: '9:00 AM – 1:00 PM', qualification: '', experience: '' });
  const [docError, setDocError] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);

  // Reset doctor filter when selected clinic changes
  useEffect(() => {
    setFilterDoctor('All');
  }, [selectedClinicId]);

  const [newClinic, setNewClinic] = useState({
    name: '',
    specialty: 'General',
    address: '',
    fee: '',
    contact: '',
    totalTokens: 40,
    avgWaitTime: 'Ready / No wait',
    icon: '🏥',
    adminEmail: '',
    adminPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [onboardForm, setOnboardForm] = useState({
    specialty: 'General',
    icon: '🏥',
    address: '',
    fee: '120',
    timings: '9:00 AM – 1:00 PM',
    contact: '',
    totalTokens: '40'
  });
  const [onboardError, setOnboardError] = useState('');
  const [isOnboardingSubmit, setIsOnboardingSubmit] = useState(false);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!onboardForm.address || !onboardForm.contact || !onboardForm.timings) {
      setOnboardError('Please fill out Address, Timings, and Contact Number');
      return;
    }
    setOnboardError('');
    setIsOnboardingSubmit(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'completeOnboarding',
          clinicId: clinic._id,
          ...onboardForm
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Clinic profile onboarding completed successfully!');
        onRefresh();
      } else {
        setOnboardError(json.error || 'Failed to complete onboarding');
      }
    } catch (err) {
      setOnboardError('Error completing onboarding: ' + err.message);
    } finally {
      setIsOnboardingSubmit(false);
    }
  };

  const handleCreateClinic = async (e) => {
    e.preventDefault();
    if (!newClinic.name || !newClinic.adminEmail || !newClinic.adminPassword) {
      setFormError('Please fill out Clinic Name, Admin Email, and Admin Password');
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newClinic, doctors: [] })
      });
      const json = await res.json();
      if (json.success) {
        alert('Clinic created successfully!');
        setNewClinic({
          name: '',
          specialty: 'General',
          address: '',
          fee: '',
          contact: '',
          totalTokens: 40,
          avgWaitTime: 'Ready / No wait',
          icon: '🏥',
          adminEmail: '',
          adminPassword: ''
        });
        if (isClinicAdmin) {
          setActiveTab('queue');
        } else {
          setActiveTab('add-clinic');
        }
        onRefresh();
      } else {
        setFormError(json.error || 'Failed to create clinic');
      }
    } catch (err) {
      setFormError('Error creating clinic: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClinic = async (clinicId, clinicName) => {
    if (!window.confirm(`Are you sure you want to remove the clinic "${clinicName}"? This will delete the clinic profile and all its associated bookings.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clinics?id=${clinicId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        alert('Clinic removed successfully!');
        
        // If the deleted clinic was selected, reset selection
        if (selectedClinicId === clinicId) {
          const remaining = clinics.filter(c => c._id !== clinicId);
          setSelectedClinicId(remaining[0]?._id || '');
        }

        onRefresh();
      } else {
        alert('Failed to remove clinic: ' + json.error);
      }
    } catch (err) {
      alert('Error removing clinic: ' + err.message);
    }
  };

  const clinic = clinics.find(c => c._id === selectedClinicId) || clinics[0] || {};
  const clinicBookings = bookings.filter(b => {
    if (b.clinicId !== selectedClinicId) return false;
    const d = new Date(b.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const clinicDoctors = clinic.doctors && clinic.doctors.length > 0
    ? clinic.doctors
    : (clinic.doctorName ? [{ name: clinic.doctorName, specialty: clinic.specialty, timings: clinic.timings, session: 'Morning', isUnavailable: false, isPaused: false, delayMinutes: 0 }] : []);

  const activeBookings = filterDoctor === 'All'
    ? clinicBookings
    : clinicBookings.filter(b => b.doctorName === filterDoctor);

  // Stats calculation
  const booked = activeBookings.length;
  const done = activeBookings.filter(b => b.status === 'done').length;
  const waiting = activeBookings.filter(b => b.status === 'waiting').length;
  const serving = activeBookings.filter(b => b.status === 'serving').length;
  const cancelled = activeBookings.filter(b => b.status === 'cancelled').length;

  const currentServingPatient = activeBookings.find(b => b.status === 'serving');
  const queuePatients = activeBookings.filter(b => b.status === 'waiting');

  const handleAdminAction = async (payload) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic._id, ...payload })
      });
      const json = await res.json();
      if (json.success) {
        onRefresh();
      } else {
        alert('Action failed: ' + json.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error performing admin action');
    }
  };

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.timings) {
      setDocError('Please fill out Name and Timings');
      return;
    }
    setDocError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addDoctor',
          clinicId: clinic._id,
          doctorName: newDoc.name,
          specialty: newDoc.specialty,
          session: newDoc.session,
          timings: newDoc.timings,
          qualification: newDoc.qualification,
          experience: newDoc.experience
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(`Doctor ${newDoc.name} registered successfully!`);
        setNewDoc({ name: '', specialty: 'General', session: 'Morning', timings: '9:00 AM – 1:00 PM', qualification: '', experience: '' });
        onRefresh();
      } else {
        setDocError(json.error || 'Failed to add doctor');
      }
    } catch (err) {
      setDocError('Error adding doctor: ' + err.message);
    }
  };

  const handleEditDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!editingDoc.name || !editingDoc.timings) {
      alert('Please fill out Name and Timings');
      return;
    }
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'editDoctor',
          clinicId: clinic._id,
          originalName: editingDoc.originalName,
          session: editingDoc.session,
          doctorName: editingDoc.name,
          specialty: editingDoc.specialty,
          timings: editingDoc.timings,
          qualification: editingDoc.qualification,
          experience: editingDoc.experience
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Doctor details updated successfully!');
        setEditingDoc(null);
        onRefresh();
      } else {
        alert('Failed to update doctor: ' + json.error);
      }
    } catch (err) {
      alert('Error updating doctor: ' + err.message);
    }
  };

  const handleUpdateClinicProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateClinicDetails',
          clinicId: clinic._id,
          address: editAddress,
          fee: Number(editFee),
          contact: editContact
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Clinic details updated successfully!');
        const updatedClinic = json.data;
        if (updatedClinic) {
          setEditAddress(updatedClinic.address || '');
          setEditFee(updatedClinic.fee?.toString() || '');
          setEditContact(updatedClinic.contact || '');
        }
        onRefresh();
      } else {
        alert('Failed to update clinic details: ' + json.error);
      }
    } catch (err) {
      alert('Error updating clinic details: ' + err.message);
    }
  };

  const handleMarkDone = (bookingId) => {
    handleAdminAction({ action: 'updateBookingStatus', bookingId, status: 'done' });
  };

  const handleUpdateLimit = (delta) => {
    const newLimit = Math.max(5, Math.min(150, (clinic.totalTokens || 40) + delta));
    handleAdminAction({ action: 'updateLimit', limit: newLimit });
  };

  const handleAddDelay = () => {
    const newDelay = (clinic.delayMinutes || 0) + 30;
    handleAdminAction({ action: 'updateDelay', delay: newDelay });
    alert(`Doctor delayed by 30 mins. All waiting patients notified via WhatsApp.`);
  };

  const handleToggleUnavailable = () => {
    const isUnavail = !clinic.isUnavailable;
    handleAdminAction({ action: 'toggleUnavailable', isUnavailable: isUnavail });
    alert(isUnavail ? 'Clinic marked Closed today. Remaining tokens refunded.' : 'Clinic marked Open.');
  };

  const [requestsList, setRequestsList] = useState([]);

  const handleAcceptRequest = (id, name, time) => {
    setRequestsList(prev => prev.filter(r => r.id !== id));
    alert(`Specialist request accepted for ${name} at ${time}. Token generated.`);
  };

  const handleRejectRequest = (id, name) => {
    setRequestsList(prev => prev.filter(r => r.id !== id));
    alert(`Specialist request rejected for ${name}. Refund initiated.`);
  };

  const isProfileIncomplete = isClinicAdmin && (!clinic.address || !clinic.contact || !clinic.timings);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      
      {/* ADMIN HEADER */}
      <div className="admin-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          {isClinicAdmin ? (
            <div>
              <div className="admin-name">{clinic.name}</div>
              <div className="admin-sub">🏥 {clinic.specialty || 'Profile Incomplete'} · {clinic.timings || 'Setup timing'} · Today</div>
            </div>
          ) : (
            <div>
              <div className="admin-name">TokenQ Platform Admin</div>
              <div className="admin-sub">Manage and onboard clinics</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            {/* Dropdown to switch clinic admin view (Only visible to Super-Admin if clinics exist) */}
            {!isClinicAdmin && clinics.length > 0 && (
              <select 
                value={selectedClinicId} 
                onChange={(e) => setSelectedClinicId(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {clinics.map(c => (
                  <option key={c._id} value={c._id} style={{ color: 'black' }}>
                    {c.icon} {c.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            )}
            {onLogout && (
              <button 
                onClick={onLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
              >
                🚪 Logout
              </button>
            )}
          </div>
        </div>
        
        {/* Top Mini Stats */}
        {/* Top Mini Stats */}
        {isClinicAdmin && !isProfileIncomplete && (
          <div className="stat-grid3">
            <div className="stat4">
              <div className="stat4-num">{booked}</div>
              <div className="stat4-lbl">Booked</div>
            </div>
            <div className="stat4">
              <div className="stat4-num" style={{ color: 'var(--green-mid)' }}>{done}</div>
              <div className="stat4-lbl">Done</div>
            </div>
            <div className="stat4">
              <div className="stat4-num" style={{ color: '#FDA4A4' }}>{cancelled}</div>
              <div className="stat4-lbl">Cancelled</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      {(!isClinicAdmin || !isProfileIncomplete) && (
        <div className="admin-tabs">
          {isClinicAdmin ? (
            <>
              <div 
                className={`atab ${activeTab === 'queue' ? 'active' : ''}`} 
                onClick={() => setActiveTab('queue')}
              >
                Live queue ({waiting + serving})
              </div>
              <div 
                className={`atab ${activeTab === 'controls' ? 'active' : ''}`} 
                onClick={() => setActiveTab('controls')}
              >
                Controls
              </div>
            </>
          ) : (
            <div 
              className={`atab ${activeTab === 'add-clinic' ? 'active' : ''}`} 
              onClick={() => setActiveTab('add-clinic')}
            >
              ➕ Add Clinic
            </div>
          )}
        </div>
      )}

      {/* Scrollable Container */}
      <div className="scrollable">
        <div className="pad">
          {/* ONBOARDING PROFILE FORM */}
          {isProfileIncomplete && (
            <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '30px' }}>
              <div style={{ background: 'var(--blue-light)', color: 'var(--blue-dark)', padding: '12px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(59, 130, 246, 0.15)', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                👋 Welcome! Let's set up your clinic profile. Before you can manage bookings and schedules, please complete your clinic information.
              </div>

              {onboardError && (
                <div style={{ color: 'var(--red)', background: 'var(--red-light)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(163, 45, 45, 0.15)' }}>
                  ⚠️ {onboardError}
                </div>
              )}

              <div className="frow" style={{ display: 'flex', gap: '10px' }}>
                <div className="fg" style={{ flex: 1 }}>
                  <label className="fl">Clinic Specialty *</label>
                  <select
                    className="fi-input"
                    value={onboardForm.specialty}
                    onChange={(e) => setOnboardForm({...onboardForm, specialty: e.target.value})}
                    style={{ background: 'var(--surface2)', cursor: 'pointer', width: '100%' }}
                  >
                    <option value="General">General Practice</option>
                    <option value="Paediatrics">Paediatrics</option>
                    <option value="Dental">Dental Care</option>
                    <option value="Orthopaedics">Orthopaedics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Cardiology">Cardiology</option>
                  </select>
                </div>

                <div className="fg" style={{ flex: 1 }}>
                  <label className="fl">Icon Emoji *</label>
                  <select
                    className="fi-input"
                    value={onboardForm.icon}
                    onChange={(e) => setOnboardForm({...onboardForm, icon: e.target.value})}
                    style={{ background: 'var(--surface2)', cursor: 'pointer', width: '100%' }}
                  >
                    <option value="🏥">🏥 Clinic</option>
                    <option value="🦷">🦷 Dental</option>
                    <option value="👶">👶 Baby</option>
                    <option value="🦴">🦴 Bone</option>
                    <option value="👩‍⚕️">👩‍⚕️ Doctor (F)</option>
                    <option value="👨‍⚕️">👨‍⚕️ Doctor (M)</option>
                    <option value="👁️">👁️ Eye</option>
                    <option value="❤️">❤️ Heart</option>
                  </select>
                </div>
              </div>

              <div className="fg">
                <label className="fl">Address *</label>
                <input
                  type="text"
                  className="fi-input"
                  placeholder="e.g. Anna Nagar, Thanjavur"
                  value={onboardForm.address}
                  onChange={(e) => setOnboardForm({...onboardForm, address: e.target.value})}
                  required
                />
              </div>

              <div className="frow" style={{ display: 'flex', gap: '10px' }}>
                <div className="fg" style={{ flex: 1 }}>
                  <label className="fl">Consultation Fee (₹) *</label>
                  <input
                    type="number"
                    className="fi-input"
                    placeholder="120"
                    value={onboardForm.fee}
                    onChange={(e) => setOnboardForm({...onboardForm, fee: e.target.value})}
                    required
                  />
                </div>

                <div className="fg" style={{ flex: 1 }}>
                  <label className="fl">Max Token Limit *</label>
                  <input
                    type="number"
                    className="fi-input"
                    placeholder="40"
                    value={onboardForm.totalTokens}
                    onChange={(e) => setOnboardForm({...onboardForm, totalTokens: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="fg">
                <label className="fl">Clinic Timings *</label>
                <input
                  type="text"
                  className="fi-input"
                  placeholder="e.g. 9:00 AM – 1:00 PM"
                  value={onboardForm.timings}
                  onChange={(e) => setOnboardForm({...onboardForm, timings: e.target.value})}
                  required
                />
              </div>

              <div className="fg">
                <label className="fl">Contact Number *</label>
                <input
                  type="text"
                  className="fi-input"
                  placeholder="e.g. +91 94430 XXXXX"
                  value={onboardForm.contact}
                  onChange={(e) => setOnboardForm({...onboardForm, contact: e.target.value})}
                  required
                />
              </div>

              <button type="submit" className="btn-p" disabled={isOnboardingSubmit} style={{ marginTop: '10px' }}>
                {isOnboardingSubmit ? 'Saving Profile...' : 'Complete Profile Setup ✓'}
              </button>
            </form>
          )}

          {/* QUEUE TAB */}
          {activeTab === 'queue' && !isProfileIncomplete && (
            <div>
              {/* Doctor filter dropdown */}
              {clinicDoctors.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', background: 'var(--surface2)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)' }}>
                    👨‍⚕️ Filter by Doctor:
                  </div>
                  <select 
                    value={filterDoctor} 
                    onChange={(e) => setFilterDoctor(e.target.value)}
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      border: '1.5px solid var(--border)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="All">All Doctors ({clinicBookings.length} tokens)</option>
                    {clinicDoctors.map(d => {
                      const docBookings = clinicBookings.filter(b => b.doctorName === d.name);
                      return (
                        <option key={d._id || d.name} value={d.name}>
                          {d.name} ({d.session} - {docBookings.length} tokens)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="sec-label">Currently serving</div>
              {currentServingPatient ? (
                <div 
                  onClick={() => setViewingPatient(currentServingPatient)}
                  style={{ background: 'var(--green-light)', borderRadius: 'var(--radius)', padding: '13px 15px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                >
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '20px', fontWeight: 500, color: 'var(--green-dark)', background: 'white', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {currentServingPatient.tokenNumber}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--green-dark)' }}>{currentServingPatient.patientName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--green)', marginTop: '1px' }}>
                      {currentServingPatient.patientAge} yrs · {currentServingPatient.patientGender === 'M' ? 'Male' : 'Female'} · {currentServingPatient.slot}
                    </div>
                    {currentServingPatient.complaints?.length > 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--green-dark)', marginTop: '2px' }}>
                        Symptoms: {currentServingPatient.complaints.join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentServingPatient.patientPhone && (
                      <>
                        <a 
                          href={`tel:${currentServingPatient.patientPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'white',
                            border: '1.5px solid var(--green-mid)',
                            textDecoration: 'none',
                            fontSize: '15px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            transition: 'transform 0.1s'
                          }}
                          title={`Call ${currentServingPatient.patientName}`}
                        >
                          📞
                        </a>
                        <a 
                          href={getWhatsAppLink(currentServingPatient.patientPhone, currentServingPatient.patientName, currentServingPatient.tokenNumber)}
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#E8F5E9',
                            border: '1.5px solid #2E7D32',
                            textDecoration: 'none',
                            fontSize: '15px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            transition: 'transform 0.1s'
                          }}
                          title={`WhatsApp ${currentServingPatient.patientName}`}
                        >
                          💬
                        </a>
                      </>
                    )}
                    <button 
                      className="btn-rej" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdminAction({ action: 'updateBookingStatus', bookingId: currentServingPatient._id, status: 'waiting' });
                      }}
                      style={{ marginRight: '6px' }}
                    >
                      Undo ↩
                    </button>
                    <button 
                      className="btn-done" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkDone(currentServingPatient._id);
                      }}
                    >
                      Done ✓
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius)', color: 'var(--text2)', marginBottom: '14px', fontSize: '13px' }}>
                  No patient is currently being served. Click "Next Up 🚀" next to a patient in the queue to start serving them.
                </div>
              )}

              <div className="sec-label">Queue ({queuePatients.length} waiting)</div>
              {queuePatients.length > 0 ? (
                queuePatients.map((patient, index) => {
                  return (
                    <div key={patient._id} className="qi" style={{ cursor: 'pointer' }} onClick={() => setViewingPatient(patient)}>
                      <div className="tkbadge" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
                        {patient.tokenNumber}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="qi-name">{patient.patientName}</div>
                        <div className="qi-det">
                          {patient.visitType === 'new' ? 'New' : 'BP Follow-up'} · {patient.slot} · {patient.complaints?.join(', ') || 'Consultation'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span 
                          className="pill pa"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdminAction({ action: 'updateBookingStatus', bookingId: patient._id, status: 'serving' });
                          }}
                          style={{
                            cursor: 'pointer',
                            transition: 'transform 0.1s'
                          }}
                          title="Click to start serving this patient"
                        >
                          Next Up 🚀
                        </span>
                        {patient.patientPhone && (
                          <>
                            <a 
                              href={`tel:${patient.patientPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: 'var(--green-light)',
                                color: 'var(--green-dark)',
                                textDecoration: 'none',
                                fontSize: '13px',
                                border: '1px solid var(--green)',
                                transition: 'transform 0.1s'
                              }}
                              title={`Call ${patient.patientName}`}
                            >
                              📞
                            </a>
                            <a 
                              href={getWhatsAppLink(patient.patientPhone, patient.patientName, patient.tokenNumber)}
                              onClick={(e) => e.stopPropagation()}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: '#E8F5E9',
                                color: '#2E7D32',
                                textDecoration: 'none',
                                fontSize: '13px',
                                border: '1px solid #C8E6C9',
                                transition: 'transform 0.1s'
                              }}
                              title={`WhatsApp ${patient.patientName}`}
                            >
                              💬
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
                  No patients waiting in queue.
                </div>
              )}
            </div>
          )}

          {/* CONTROLS TAB */}
          {activeTab === 'controls' && !isProfileIncomplete && (
            <div>
              <div className="sec-label">Today's limit</div>
              <div className="ctrl-card" style={{ marginBottom: '16px' }}>
                <div className="ctrl-title">Max tokens / day</div>
                <div className="lim-row">
                  <button className="lim-btn" onClick={() => handleUpdateLimit(-5)}>−</button>
                  <div className="lim-val">{clinic.totalTokens || 40}</div>
                  <button className="lim-btn" onClick={() => handleUpdateLimit(5)}>+</button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', textAlign: 'center', marginTop: '7px' }}>
                  {booked} already booked today
                </div>
              </div>

              <div className="sec-label">📅 Active Days Schedule</div>
              <div className="ctrl-card" style={{ marginBottom: '16px' }}>
                <div className="ctrl-title" style={{ marginBottom: '10px' }}>Select available days for this clinic:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const isActive = clinic.activeDays ? clinic.activeDays.includes(day) : true;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          let current = clinic.activeDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                          let updated = [];
                          if (isActive) {
                            updated = current.filter(d => d !== day);
                          } else {
                            updated = [...current, day];
                          }
                          handleAdminAction({ action: 'updateActiveDays', activeDays: updated });
                        }}
                        style={{
                          background: isActive ? 'var(--green-light)' : 'var(--surface2)',
                          color: isActive ? 'var(--green-dark)' : 'var(--text3)',
                          border: '1.5px solid ' + (isActive ? 'var(--green)' : 'var(--border2)'),
                          borderRadius: '20px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {day.slice(0, 3)} {isActive ? '✓' : '✗'}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text2)', textAlign: 'center', marginTop: '10px' }}>
                  Unselected days will show the clinic as <strong>"Closed"</strong> to patients on the home page.
                </div>
              </div>

              <div className="sec-label">📍 Update Clinic Details</div>
              <form onSubmit={handleUpdateClinicProfile} className="ctrl-card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Clinic Address</label>
                  <input 
                    type="text" 
                    className="fi-input" 
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    required 
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="fg" style={{ margin: 0 }}>
                    <label className="fl">Consultation Fee (₹)</label>
                    <input 
                      type="number" 
                      className="fi-input" 
                      value={editFee}
                      onChange={(e) => setEditFee(e.target.value)}
                      required 
                    />
                  </div>
                  
                  <div className="fg" style={{ margin: 0 }}>
                    <label className="fl">Contact Number</label>
                    <input 
                      type="text" 
                      className="fi-input" 
                      value={editContact}
                      onChange={(e) => setEditContact(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn-p" style={{ padding: '9px', fontSize: '13px', marginTop: '4px', width: 'auto', alignSelf: 'flex-start' }}>
                  Save Details ✓
                </button>
              </form>

              <div className="sec-label">👨‍⚕️ Manage Doctors ({clinicDoctors.length})</div>
              {clinicDoctors.map((doc, idx) => {
                const docBookings = clinicBookings.filter(b => b.doctorName === doc.name);
                const isEditing = editingDoc && editingDoc.originalName === doc.name && editingDoc.session === doc.session;

                return (
                  <div key={idx} className="ctrl-card" style={{ marginBottom: '14px', border: '1px solid var(--border)' }}>
                    {isEditing ? (
                      <form onSubmit={handleEditDoctorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '5px' }}>
                        <div className="fg" style={{ margin: 0 }}>
                          <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Doctor Name</label>
                          <input 
                            type="text" 
                            className="fi-input" 
                            value={editingDoc.name}
                            onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                            required 
                          />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div className="fg" style={{ margin: 0 }}>
                            <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Specialty</label>
                            <select 
                              className="fi-input" 
                              value={editingDoc.specialty}
                              onChange={(e) => setEditingDoc({ ...editingDoc, specialty: e.target.value })}
                            >
                              <option value="General">General</option>
                              <option value="Dental">Dental</option>
                              <option value="Paediatric">Paediatric</option>
                              <option value="Orthopaedic">Orthopaedic</option>
                              <option value="Gynaecology">Gynaecology</option>
                              <option value="Dermatology">Dermatology</option>
                              <option value="Ophthalmology">Ophthalmology</option>
                            </select>
                          </div>
                          
                          <div className="fg" style={{ margin: 0 }}>
                            <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Timings</label>
                            <input 
                              type="text" 
                              className="fi-input" 
                              value={editingDoc.timings}
                              onChange={(e) => setEditingDoc({ ...editingDoc, timings: e.target.value })}
                              required 
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div className="fg" style={{ margin: 0 }}>
                            <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Qualification</label>
                            <input 
                              type="text" 
                              className="fi-input" 
                              placeholder="e.g. MBBS, MD" 
                              value={editingDoc.qualification}
                              onChange={(e) => setEditingDoc({ ...editingDoc, qualification: e.target.value })}
                            />
                          </div>
                          <div className="fg" style={{ margin: 0 }}>
                            <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Experience</label>
                            <input 
                              type="text" 
                              className="fi-input" 
                              placeholder="e.g. 10+ Yrs Exp" 
                              value={editingDoc.experience}
                              onChange={(e) => setEditingDoc({ ...editingDoc, experience: e.target.value })}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button type="submit" className="btn-p" style={{ padding: '8px 16px', fontSize: '12px', width: 'auto', margin: 0 }}>
                            Save ✓
                          </button>
                          <button type="button" className="btn-s" onClick={() => setEditingDoc(null)} style={{ padding: '8px 16px', fontSize: '12px', width: 'auto', margin: 0 }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border2)', paddingBottom: '8px', marginBottom: '10px' }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{doc.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
                              🎓 {doc.specialty}
                              {doc.qualification && ` · ${doc.qualification}`}
                              {doc.experience && ` (${doc.experience})`}
                              {` · ⏰ ${doc.timings} (${doc.session})`}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button 
                              onClick={() => setEditingDoc({
                                originalName: doc.name,
                                session: doc.session,
                                name: doc.name,
                                specialty: doc.specialty,
                                timings: doc.timings,
                                qualification: doc.qualification || '',
                                experience: doc.experience || ''
                              })}
                              style={{
                                background: 'transparent',
                                border: '1.5px solid var(--border)',
                                color: 'var(--text2)',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <div className={`pill ${doc.isUnavailable ? 'pr' : 'pg'}`} style={{ fontSize: '10px' }}>
                              {doc.isUnavailable ? 'Offline' : 'Active'}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {/* Delay modifier button */}
                          <button 
                            className="act-btn" 
                            onClick={() => handleAdminAction({ action: 'updateDelay', doctorName: doc.name, delay: doc.delayMinutes > 0 ? 0 : 30 })}
                            style={{ margin: 0, padding: '8px 10px', fontSize: '11px' }}
                          >
                            <div className="act-icon" style={{ background: 'var(--blue-light)', fontSize: '12px', width: '22px', height: '22px', lineHeight: '22px' }}>⏱️</div>
                            <span>{doc.delayMinutes > 0 ? `Reset Delay (${doc.delayMinutes}m)` : 'Delay +30 min'}</span>
                          </button>

                          {/* Pause modifier button */}
                          <button 
                            className="act-btn" 
                            onClick={() => handleAdminAction({ action: 'togglePaused', doctorName: doc.name, isPaused: !doc.isPaused })}
                            style={{ margin: 0, padding: '8px 10px', fontSize: '11px' }}
                          >
                            <div className="act-icon" style={{ background: 'var(--amber-light)', fontSize: '12px', width: '22px', height: '22px', lineHeight: '22px' }}>⏸️</div>
                            <span>{doc.isPaused ? 'Resume Bookings' : 'Pause Bookings'}</span>
                          </button>

                          {/* Availability status modifier button */}
                          <button 
                            className="act-btn" 
                            onClick={() => handleAdminAction({ action: 'toggleUnavailable', doctorName: doc.name, isUnavailable: !doc.isUnavailable })}
                            style={{ margin: 0, padding: '8px 10px', fontSize: '11px' }}
                          >
                            <div className="act-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', fontSize: '12px', width: '22px', height: '22px', lineHeight: '22px' }}>🔴</div>
                            <span>{doc.isUnavailable ? 'Mark Available' : 'Mark Unavailable'}</span>
                          </button>

                          {/* Cancel Slots / Clear queue button */}
                          <button 
                            className="act-btn danger" 
                            onClick={() => confirm(`Cancel remaining slots for ${doc.name}?`) && alert('Slots cancelled. Patient WhatsApp notifications dispatched.')}
                            style={{ margin: 0, padding: '8px 10px', fontSize: '11px' }}
                          >
                            <div className="act-icon" style={{ background: 'var(--red-light)', fontSize: '12px', width: '22px', height: '22px', lineHeight: '22px' }}>❌</div>
                            <span>Cancel Slots</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              <div className="sec-label">➕ Add Doctor to Clinic</div>
              <form onSubmit={handleAddDoctorSubmit} className="ctrl-card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border)' }}>
                {docError && (
                  <div style={{ color: 'var(--red)', fontSize: '12px' }}>
                    ⚠️ {docError}
                  </div>
                )}
                
                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Doctor Name</label>
                  <input 
                    type="text" 
                    className="fi-input" 
                    placeholder="e.g. Dr. Rajesh Kumar" 
                    value={newDoc.name}
                    onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="fg" style={{ margin: 0 }}>
                    <label className="fl">Specialty</label>
                    <select 
                      className="fi-input" 
                      value={newDoc.specialty}
                      onChange={(e) => setNewDoc({ ...newDoc, specialty: e.target.value })}
                    >
                      <option value="General">General</option>
                      <option value="Dental">Dental</option>
                      <option value="Paediatric">Paediatric</option>
                      <option value="Orthopaedic">Orthopaedic</option>
                      <option value="Gynaecology">Gynaecology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Ophthalmology">Ophthalmology</option>
                    </select>
                  </div>

                  <div className="fg" style={{ margin: 0 }}>
                    <label className="fl">Session</label>
                    <select 
                      className="fi-input" 
                      value={newDoc.session}
                      onChange={(e) => {
                        const s = e.target.value;
                        let t = '9:00 AM – 1:00 PM';
                        if (s === 'Afternoon') t = '2:00 PM – 5:00 PM';
                        else if (s === 'Evening') t = '5:00 PM – 8:00 PM';
                        else if (s === 'Night') t = '6:00 PM – 9:00 PM';
                        setNewDoc({ ...newDoc, session: s, timings: t });
                      }}
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                </div>

                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Timings</label>
                  <input 
                    type="text" 
                    className="fi-input" 
                    value={newDoc.timings}
                    onChange={(e) => setNewDoc({ ...newDoc, timings: e.target.value })}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="fg" style={{ margin: 0 }}>
                    <label className="fl">Qualification</label>
                    <input 
                      type="text" 
                      className="fi-input" 
                      placeholder="e.g. MBBS, MD" 
                      value={newDoc.qualification}
                      onChange={(e) => setNewDoc({ ...newDoc, qualification: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="fg" style={{ margin: 0 }}>
                    <label className="fl">Experience</label>
                    <input 
                      type="text" 
                      className="fi-input" 
                      placeholder="e.g. 10+ Yrs Exp" 
                      value={newDoc.experience}
                      onChange={(e) => setNewDoc({ ...newDoc, experience: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn-p" style={{ padding: '9px', fontSize: '13px', marginTop: '4px' }}>
                  Register Doctor ✓
                </button>
              </form>
            </div>
          )}

          {activeTab === 'add-clinic' && !isClinicAdmin && (
            <form onSubmit={handleCreateClinic} style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '30px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                Register New Clinic
              </div>

              {formError && (
                <div style={{ color: 'var(--red)', background: 'var(--red-light)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(163, 45, 45, 0.15)' }}>
                  ⚠️ {formError}
                </div>
              )}

              <div className="fg">
                <label className="fl">Clinic Name *</label>
                <input
                  type="text"
                  className="fi-input"
                  placeholder="e.g. Sakthi Paediatric Clinic"
                  value={newClinic.name}
                  onChange={(e) => setNewClinic({...newClinic, name: e.target.value})}
                  required
                />
              </div>



              <div className="frow" style={{ display: 'flex', gap: '10px' }}>
                <div className="fg" style={{ flex: 1 }}>
                  <label className="fl">Admin Login Email *</label>
                  <input
                    type="email"
                    className="fi-input"
                    placeholder="e.g. adipan@gmail.com"
                    value={newClinic.adminEmail}
                    onChange={(e) => setNewClinic({...newClinic, adminEmail: e.target.value.toLowerCase()})}
                    required
                  />
                </div>

                <div className="fg" style={{ flex: 1 }}>
                  <label className="fl">Admin Password *</label>
                  <input
                    type="password"
                    className="fi-input"
                    placeholder="e.g. securePass123"
                    value={newClinic.adminPassword}
                    onChange={(e) => setNewClinic({...newClinic, adminPassword: e.target.value})}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-p" disabled={isSubmitting} style={{ marginTop: '10px' }}>
                {isSubmitting ? 'Creating Clinic...' : 'Register Clinic ✓'}
              </button>
            </form>
          )}

          {/* REGISTERED CLINICS LIST */}
          {activeTab === 'add-clinic' && !isClinicAdmin && (
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px' }}>
                Registered Clinics ({clinics.length})
              </div>
              {clinics.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius)', color: 'var(--text2)', fontSize: '13px' }}>
                  No clinics registered yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {clinics.map((c) => (
                    <div 
                      key={c._id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        background: 'var(--surface2)', 
                        padding: '12px 16px', 
                        borderRadius: 'var(--radius)', 
                        border: '1.5px solid var(--border2)' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>{c.icon || '🏥'}</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                            🔑 {c.adminEmail} · 🎓 {c.specialty}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteClinic(c._id, c.name)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Patient EMR Details Modal */}
      {viewingPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setViewingPatient(null)}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span className="pill pg" style={{ fontSize: '11px', marginBottom: '6px', display: 'inline-block' }}>
                  Token {viewingPatient.tokenNumber}
                </span>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
                  {viewingPatient.patientName}
                </h3>
              </div>
              <button 
                onClick={() => setViewingPatient(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--text3)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Content Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--surface2)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Age / Gender</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                    {viewingPatient.patientAge || '—'} yrs · {viewingPatient.patientGender === 'M' ? 'Male' : viewingPatient.patientGender === 'F' ? 'Female' : 'Other'}
                  </div>
                </div>
                <div style={{ background: 'var(--surface2)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Visit Type</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '2px', textTransform: 'capitalize' }}>
                    {viewingPatient.visitType || 'new'} Patient
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--surface2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Contact Number</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                  {viewingPatient.patientPhone || '—'}
                </div>
              </div>

              <div style={{ background: 'var(--surface2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Chief Complaints</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {viewingPatient.complaints && viewingPatient.complaints.length > 0 ? (
                    viewingPatient.complaints.map(c => (
                      <span key={c} style={{ background: 'var(--green-light)', color: 'var(--green-dark)', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>
                        {c}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text2)' }}>General Consultation</span>
                  )}
                </div>
              </div>

              {viewingPatient.describeComplaint && (
                <div style={{ background: 'var(--surface2)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Description / Notes</div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', marginTop: '4px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                    {viewingPatient.describeComplaint}
                  </div>
                </div>
              )}

              <div style={{ background: 'var(--surface2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Current Medications</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: viewingPatient.medication === 'yes' ? 'var(--amber-dark)' : 'var(--text2)', marginTop: '4px' }}>
                  {viewingPatient.medication === 'yes' ? '⚠️ Taking existing medications (Review required)' : 'None'}
                </div>
              </div>

              {viewingPatient.severity && (
                <div style={{ background: 'var(--surface2)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Severity Level</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: viewingPatient.severity.toLowerCase().includes('severe') ? 'var(--red)' : viewingPatient.severity.toLowerCase().includes('moderate') ? 'var(--amber)' : 'var(--green-dark)', marginTop: '4px' }}>
                    {viewingPatient.severity}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {viewingPatient.patientPhone && (
                  <>
                    <a 
                      href={`tel:${viewingPatient.patientPhone}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '11px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--green)',
                        background: 'var(--green-light)',
                        color: 'var(--green-dark)',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        textAlign: 'center'
                      }}
                    >
                      📞 Call Phone
                    </a>
                    <a 
                      href={getWhatsAppLink(viewingPatient.patientPhone, viewingPatient.patientName, viewingPatient.tokenNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '11px',
                        borderRadius: '8px',
                        border: '1.5px solid #2E7D32',
                        background: '#E8F5E9',
                        color: '#2E7D32',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        textAlign: 'center'
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  </>
                )}
              </div>

              {viewingPatient.status === 'waiting' && (
                <button
                  onClick={() => {
                    handleAdminAction({ action: 'updateBookingStatus', bookingId: viewingPatient._id, status: 'serving' });
                    setViewingPatient(null);
                  }}
                  style={{
                    background: 'var(--green)',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚀 Call Inside (Start Serving)
                </button>
              )}

              {viewingPatient.status === 'serving' && (
                <button
                  onClick={() => {
                    handleMarkDone(viewingPatient._id);
                    setViewingPatient(null);
                  }}
                  style={{
                    background: 'var(--green-dark)',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Complete Consultation
                </button>
              )}

              {viewingPatient.status !== 'done' && viewingPatient.status !== 'cancelled' && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this booking?')) {
                      handleAdminAction({ action: 'updateBookingStatus', bookingId: viewingPatient._id, status: 'cancelled' });
                      setViewingPatient(null);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--red)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '6px',
                    textDecoration: 'underline'
                  }}
                >
                  Cancel Booking Token
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
