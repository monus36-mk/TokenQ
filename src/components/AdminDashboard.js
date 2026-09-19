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

  const getPrescriptionWhatsAppLink = (phone, patientName, prescription, clinicalNotes) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    let message = `*PRESCRIPTION & MEDICAL FILE*\n`;
    message += `Clinic: *${clinic.name || 'Clinic'}*\n`;
    message += `Patient: *${patientName}*\n`;
    message += `Date: *${new Date().toLocaleDateString('en-IN')}*\n\n`;

    if (clinicalNotes) {
      message += `*Diagnosis/Clinical Notes:*\n${clinicalNotes}\n\n`;
    }

    if (prescription) {
      message += `*Rx (Prescription):*\n${prescription}\n\n`;
    } else {
      message += `*Rx (Prescription):*\nGeneral Consultation - Follow advice.\n\n`;
    }

    message += `Get well soon!`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const normalizePhone = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').slice(-10);
  };

  const [selectedClinicId, setSelectedClinicId] = useState(defaultClinicId);
  const [activeTab, setActiveTab] = useState(isClinicAdmin ? 'queue' : 'add-clinic');
  const [viewingPatient, setViewingPatient] = useState(null);

  const [currentNotes, setCurrentNotes] = useState('');
  const [currentPrescription, setCurrentPrescription] = useState('');
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  useEffect(() => {
    if (viewingPatient) {
      setCurrentNotes('');
      setCurrentPrescription('');
      setEditingRecordId(null);
      setExpandedHistoryId(null);
    } else {
      setCurrentNotes('');
      setCurrentPrescription('');
      setEditingRecordId(null);
      setExpandedHistoryId(null);
    }
  }, [viewingPatient?._id]);

  // Keep viewingPatient synced with fresh bookings data
  useEffect(() => {
    if (viewingPatient && bookings) {
      const fresh = bookings.find(b => String(b._id) === String(viewingPatient._id));
      if (fresh) {
        if (
          fresh.clinicalNotes !== viewingPatient.clinicalNotes ||
          fresh.prescription !== viewingPatient.prescription ||
          fresh.status !== viewingPatient.status
        ) {
          setViewingPatient(prev => ({ ...prev, ...fresh }));
        }
      }
    }
  }, [bookings]);

  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editProfilePic, setEditProfilePic] = useState('');
  const [loadedClinicId, setLoadedClinicId] = useState(null);

  useEffect(() => {
    const activeClinic = clinics.find(c => c._id === selectedClinicId) || clinics[0];
    if (activeClinic && activeClinic._id !== loadedClinicId) {
      setEditName(activeClinic.name || '');
      setEditAddress(activeClinic.address || '');
      setEditFee(activeClinic.fee?.toString() || '');
      setEditContact(activeClinic.contact || '');
      setEditProfilePic(activeClinic.profilePic || '');
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

  const clinic = clinics.find(c => String(c._id) === String(selectedClinicId)) || clinics[0] || {};
  const clinicBookings = bookings.filter(b => {
    if (String(b.clinicId) !== String(selectedClinicId)) return false;
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

  const handleSaveNotes = async (silent = false) => {
    if (!viewingPatient) return;
    if (!currentNotes.trim() && !currentPrescription.trim()) {
      alert('Please enter clinical notes or a prescription to save.');
      return;
    }
    setIsSavingNotes(true);
    try {
      const isNewRecord = !editingRecordId && Boolean(viewingPatient.clinicalNotes || viewingPatient.prescription);
      const targetBookingId = editingRecordId || viewingPatient._id;

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addClinicalEntry',
          clinicId: viewingPatient.clinicId || clinic._id || selectedClinicId,
          bookingId: targetBookingId,
          isNewRecord: isNewRecord,
          patientName: viewingPatient.patientName,
          patientPhone: viewingPatient.patientPhone,
          patientAge: viewingPatient.patientAge,
          patientGender: viewingPatient.patientGender,
          doctorName: viewingPatient.doctorName || clinic.doctorName,
          clinicalNotes: currentNotes,
          prescription: currentPrescription
        })
      });
      const json = await res.json();
      if (json.success) {
        if (!silent) {
          setShowSavedFeedback(true);
          setTimeout(() => setShowSavedFeedback(false), 3000);
        }

        // Erase/reset editor fields so doctor can do another entry immediately
        setCurrentNotes('');
        setCurrentPrescription('');
        setEditingRecordId(null);

        onRefresh();
      } else {
        alert('Failed to save record: ' + json.error);
      }
    } catch (err) {
      alert('Error saving record: ' + err.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteEntry = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this clinical record from history?')) {
      return;
    }
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteClinicalEntry',
          clinicId: viewingPatient?.clinicId || clinic._id || selectedClinicId,
          bookingId
        })
      });
      const json = await res.json();
      if (json.success) {
        if (editingRecordId === bookingId) {
          setEditingRecordId(null);
          setCurrentNotes('');
          setCurrentPrescription('');
        }
        onRefresh();
      } else {
        alert('Failed to delete entry: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting entry: ' + err.message);
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
          name: editName,
          address: editAddress,
          fee: Number(editFee),
          contact: editContact,
          profilePic: editProfilePic
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Clinic details updated successfully!');
        const updatedClinic = json.data;
        if (updatedClinic) {
          setEditName(updatedClinic.name || '');
          setEditAddress(updatedClinic.address || '');
          setEditFee(updatedClinic.fee?.toString() || '');
          setEditContact(updatedClinic.contact || '');
          setEditProfilePic(updatedClinic.profilePic || '');
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
                className={`atab ${activeTab === 'patients' ? 'active' : ''}`}
                onClick={() => setActiveTab('patients')}
              >
                Patient History
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
                    onChange={(e) => setOnboardForm({ ...onboardForm, specialty: e.target.value })}
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
                    onChange={(e) => setOnboardForm({ ...onboardForm, icon: e.target.value })}
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
                  onChange={(e) => setOnboardForm({ ...onboardForm, address: e.target.value })}
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
                    onChange={(e) => setOnboardForm({ ...onboardForm, fee: e.target.value })}
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
                    onChange={(e) => setOnboardForm({ ...onboardForm, totalTokens: e.target.value })}
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
                  onChange={(e) => setOnboardForm({ ...onboardForm, timings: e.target.value })}
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
                  onChange={(e) => setOnboardForm({ ...onboardForm, contact: e.target.value })}
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

          {/* PATIENT HISTORY TAB */}
          {activeTab === 'patients' && !isProfileIncomplete && (() => {
            // Get all bookings for the selected clinic
            const clinicAllBookings = bookings.filter(b => String(b.clinicId) === String(selectedClinicId));

            // Group by unique patient (Name + Phone)
            const uniquePatientsMap = {};
            clinicAllBookings.forEach(b => {
              const nameKey = (b.patientName || '').trim().toLowerCase();
              const phoneKey = normalizePhone(b.patientPhone) || (b.patientPhone || '').trim();
              const key = `${nameKey}_${phoneKey}`;

              if (!uniquePatientsMap[key]) {
                uniquePatientsMap[key] = {
                  name: b.patientName,
                  phone: b.patientPhone,
                  age: b.patientAge,
                  gender: b.patientGender,
                  visitsCount: 1,
                  lastVisited: b.createdAt,
                  latestBooking: b,
                  allBookings: [b]
                };
              } else {
                uniquePatientsMap[key].visitsCount += 1;
                uniquePatientsMap[key].allBookings.push(b);
                // Keep the most recent lastVisited date
                if (new Date(b.createdAt) > new Date(uniquePatientsMap[key].lastVisited)) {
                  uniquePatientsMap[key].lastVisited = b.createdAt;
                  uniquePatientsMap[key].age = b.patientAge;
                  uniquePatientsMap[key].gender = b.patientGender;
                  uniquePatientsMap[key].latestBooking = b;
                }
              }
            });

            // Sort allBookings descending for each patient
            Object.values(uniquePatientsMap).forEach(p => {
              p.allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              p.latestBooking = p.allBookings[0];
            });

            const uniquePatientsList = Object.values(uniquePatientsMap).sort((a, b) => new Date(b.lastVisited) - new Date(a.lastVisited));

            const filteredPatients = uniquePatientsList.filter(p =>
              (p.name && p.name.toLowerCase().includes(patientSearchQuery.toLowerCase())) ||
              (p.phone && p.phone.includes(patientSearchQuery))
            );

            return (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)' }}>
                    🔍 Search Patient Directory
                  </div>
                  <input
                    type="text"
                    className="fi-input"
                    placeholder="Search by patient name or phone number..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border2)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div className="sec-label">
                  All Registered Patients ({filteredPatients.length})
                </div>

                {filteredPatients.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius)', color: 'var(--text2)', fontSize: '13px' }}>
                    {patientSearchQuery ? 'No matching patients found.' : 'No patient records found for this clinic.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredPatients.map((patient, idx) => {
                      const lastVisitDate = new Date(patient.lastVisited).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                      const hasRecord = patient.allBookings.some(b => b.clinicalNotes || b.prescription);

                      return (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--surface2)',
                            borderRadius: '8px',
                            border: '1.5px solid var(--border)',
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          className="history-item-card"
                        >
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{patient.name}</span>
                              {hasRecord && (
                                <span className="pill pg" style={{ fontSize: '10px', padding: '2px 7px' }}>
                                  🩺 Rx On File
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '3px' }}>
                              {patient.age} yrs · {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'} · 📞 {patient.phone}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                              Last Visit: <strong>{lastVisitDate}</strong> · Total Visits: <strong>{patient.visitsCount}</strong>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              // Set viewingPatient to the latest booking of this patient
                              setViewingPatient(patient.latestBooking);
                            }}
                            style={{
                              background: 'var(--green-light)',
                              color: 'var(--green-dark)',
                              border: '1.5px solid var(--green)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            📄 Open File
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px', background: 'var(--surface2)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: 'var(--border2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1.5px solid var(--border)'
                  }}>
                    {editProfilePic ? (
                      <img src={editProfilePic} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      clinic.icon || '🏥'
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>Clinic Profile Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 800 * 1024) {
                            alert("Image size should be less than 800KB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditProfilePic(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '12px', color: 'var(--text2)' }}
                    />
                    {editProfilePic && (
                      <button
                        type="button"
                        onClick={() => setEditProfilePic('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--red)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: 0,
                          width: 'fit-content'
                        }}
                      >
                        🗑️ Remove Photo
                      </button>
                    )}
                  </div>
                </div>

                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Clinic Name</label>
                  <input
                    type="text"
                    className="fi-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

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
                  onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
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
                    onChange={(e) => setNewClinic({ ...newClinic, adminEmail: e.target.value.toLowerCase() })}
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
                    onChange={(e) => setNewClinic({ ...newClinic, adminPassword: e.target.value })}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="pill pg" style={{ fontSize: '11px' }}>
                    Token {viewingPatient.tokenNumber}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>
                    📅 {new Date(viewingPatient.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
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

              {/* Doctor's EMR Notes & Prescription Editor */}
              {(() => {
                const allPatientHistory = bookings.filter(b =>
                  String(b.clinicId) === String(viewingPatient.clinicId || clinic._id || selectedClinicId) &&
                  normalizePhone(b.patientPhone) === normalizePhone(viewingPatient.patientPhone) &&
                  (b.patientName || '').trim().toLowerCase() === (viewingPatient.patientName || '').trim().toLowerCase()
                ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                const pastClinicalBooking = allPatientHistory.find(b => (b.clinicalNotes || b.prescription) && String(b._id) !== String(editingRecordId));

                return (
                  <>
                    <div style={{
                      border: editingRecordId ? '1.5px solid var(--amber-dark)' : '1.5px solid var(--green-mid)',
                      background: editingRecordId ? 'rgba(245, 158, 11, 0.03)' : 'rgba(29, 158, 117, 0.02)',
                      borderRadius: '8px',
                      padding: '14px',
                      marginTop: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '16px' }}>🩺</span>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: editingRecordId ? 'var(--amber-dark)' : 'var(--green-dark)' }}>
                            {editingRecordId ? 'Edit Clinical Record' : "Doctor's Clinical Entry (New Entry)"}
                          </h4>
                          <span className={`pill ${editingRecordId ? 'pa' : 'pg'}`} style={{ fontSize: '10px' }}>
                            {editingRecordId ? '✏️ Editing Record' : '➕ New Entry'}
                          </span>
                        </div>
                        {editingRecordId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecordId(null);
                              setCurrentNotes('');
                              setCurrentPrescription('');
                            }}
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text2)',
                              cursor: 'pointer'
                            }}
                          >
                            + Switch to New Entry
                          </button>
                        )}
                      </div>

                      {pastClinicalBooking && !currentNotes && !currentPrescription && !editingRecordId && (
                        <div style={{
                          background: 'rgba(29, 158, 117, 0.08)',
                          border: '1px dashed var(--green)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px',
                          color: 'var(--green-dark)'
                        }}>
                          <div style={{ flex: 1, paddingRight: '8px' }}>
                            💡 <strong>Past Rx on file ({new Date(pastClinicalBooking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}):</strong> {pastClinicalBooking.prescription ? pastClinicalBooking.prescription.slice(0, 45) + '...' : 'Clinical notes on file'}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (pastClinicalBooking.clinicalNotes) setCurrentNotes(pastClinicalBooking.clinicalNotes);
                              if (pastClinicalBooking.prescription) setCurrentPrescription(pastClinicalBooking.prescription);
                            }}
                            style={{
                              background: 'var(--green)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '10px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Copy to Editor 📋
                          </button>
                        </div>
                      )}

                      <div className="fg" style={{ margin: 0 }}>
                        <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>Clinical Notes & Diagnosis</label>
                        <textarea
                          rows={3}
                          placeholder="Enter examination findings, symptoms, diagnosis (e.g. BP: 130/85, Clear lungs, viral fever)"
                          value={currentNotes}
                          onChange={(e) => setCurrentNotes(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1.5px solid var(--border2)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            fontFamily: 'inherit',
                            fontSize: '13px',
                            resize: 'vertical',
                            outline: 'none',
                            marginTop: '4px'
                          }}
                        />
                      </div>

                      <div className="fg" style={{ margin: 0 }}>
                        <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>Prescription & Treatment Plan</label>
                        <textarea
                          rows={3}
                          placeholder="Enter prescribed medicines & instructions (e.g. Paracetamol 650mg TDS x 3 days)"
                          value={currentPrescription}
                          onChange={(e) => setCurrentPrescription(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1.5px solid var(--border2)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            fontFamily: 'inherit',
                            fontSize: '13px',
                            resize: 'vertical',
                            outline: 'none',
                            marginTop: '4px'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(false)}
                          disabled={isSavingNotes}
                          style={{
                            background: editingRecordId ? 'var(--amber-dark, #B45309)' : 'var(--green-dark, #0F6E56)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '9px 18px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: isSavingNotes ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                            opacity: isSavingNotes ? 0.7 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSavingNotes ? '⏳ Saving Record...' : editingRecordId ? '💾 Update Record ✓' : '💾 Save & Add to History ✓'}
                        </button>

                        {(currentNotes || currentPrescription) && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentNotes('');
                              setCurrentPrescription('');
                              setEditingRecordId(null);
                            }}
                            style={{
                              background: 'var(--surface2)',
                              color: 'var(--text2)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                          >
                            🧹 Clear Form
                          </button>
                        )}

                        {viewingPatient.patientPhone && (
                          <a
                            href={getPrescriptionWhatsAppLink(
                              viewingPatient.patientPhone,
                              viewingPatient.patientName,
                              currentPrescription,
                              currentNotes
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              handleSaveNotes(true);
                            }}
                            style={{
                              background: '#25D366',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            💬 Send to WhatsApp
                          </a>
                        )}

                        {showSavedFeedback && (
                          <span style={{
                            color: 'var(--green-dark)',
                            fontSize: '12px',
                            fontWeight: 600,
                            marginLeft: '4px'
                          }}>
                            ✅ Saved to history! Ready for next entry.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Patient Clinical & Visit History Section */}
                    <div style={{ marginTop: '10px', borderTop: '1.5px dashed var(--border2)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '16px' }}>📜</span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                          Patient Clinical & Visit History ({allPatientHistory.length})
                        </h4>
                      </div>

                      {allPatientHistory.length === 0 ? (
                        <div style={{
                          padding: '16px',
                          textAlign: 'center',
                          background: 'var(--surface2)',
                          borderRadius: '8px',
                          color: 'var(--text2)',
                          fontSize: '12px',
                          border: '1px solid var(--border)'
                        }}>
                          First-time visitor. No past booking records found.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {allPatientHistory.map((historyItem) => {
                            const isExpanded = expandedHistoryId === historyItem._id;
                            const dateStr = new Date(historyItem.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            });
                            const timeStr = new Date(historyItem.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            const hasItemRecord = Boolean(historyItem.clinicalNotes || historyItem.prescription);
                            const isCurrentlyEditing = String(historyItem._id) === String(editingRecordId);
                            const isTodayVisit = String(historyItem._id) === String(viewingPatient._id);

                            return (
                              <div
                                key={historyItem._id}
                                className="history-item-card"
                                style={{
                                  background: isCurrentlyEditing ? 'rgba(245, 158, 11, 0.05)' : 'var(--surface2)',
                                  borderRadius: '8px',
                                  border: '1.5px solid ' + (isCurrentlyEditing ? 'var(--amber)' : hasItemRecord ? 'rgba(29, 158, 117, 0.35)' : 'var(--border)'),
                                  overflow: 'hidden',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {/* Header (Toggle Details) */}
                                <div
                                  onClick={() => setExpandedHistoryId(isExpanded ? null : historyItem._id)}
                                  style={{
                                    padding: '10px 12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    background: isExpanded ? 'rgba(0,0,0,0.02)' : 'transparent',
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <span>{dateStr} ({timeStr})</span>
                                      {isTodayVisit && (
                                        <span className="pill pg" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                          Token {historyItem.tokenNumber} (Today)
                                        </span>
                                      )}
                                      {isCurrentlyEditing && (
                                        <span className="pill pa" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                          ✏️ Editing in Form
                                        </span>
                                      )}
                                      {hasItemRecord && (
                                        <span className="pill pg" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                          🩺 Rx Attached
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>
                                      Dr. {historyItem.doctorName} · Token {historyItem.tokenNumber}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className={`pill ${historyItem.status === 'done' ? 'pg' :
                                        historyItem.status === 'cancelled' ? 'pr' : 'pa'
                                      }`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                      {historyItem.status}
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'var(--text2)' }}>
                                      {isExpanded ? '▲' : '▼'}
                                    </span>
                                  </div>
                                </div>

                                {/* Details */}
                                {isExpanded && (
                                  <div
                                    className="history-details-container"
                                    style={{
                                      padding: '12px',
                                      borderTop: '1px solid var(--border)',
                                      background: 'var(--surface)',
                                      fontSize: '12px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px'
                                    }}
                                  >
                                    <div>
                                      <strong style={{ color: 'var(--text2)' }}>Chief Complaints:</strong>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                        {historyItem.complaints && historyItem.complaints.length > 0 ? (
                                          historyItem.complaints.map(c => (
                                            <span key={c} style={{ background: 'var(--green-light)', color: 'var(--green-dark)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                                              {c}
                                            </span>
                                          ))
                                        ) : (
                                          <span style={{ color: 'var(--text2)' }}>General Consultation</span>
                                        )}
                                      </div>
                                    </div>

                                    {historyItem.describeComplaint && (
                                      <div>
                                        <strong style={{ color: 'var(--text2)' }}>Description:</strong>
                                        <div style={{ marginTop: '2px', color: 'var(--text)', fontStyle: 'italic' }}>
                                          "{historyItem.describeComplaint}"
                                        </div>
                                      </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                                      <div style={{ background: 'var(--surface2)', padding: '8px', borderRadius: '4px' }}>
                                        <strong style={{ color: 'var(--text2)', display: 'block', marginBottom: '3px' }}>Clinical Notes & Diagnosis:</strong>
                                        <span style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                                          {historyItem.clinicalNotes || 'No notes recorded.'}
                                        </span>
                                      </div>
                                      <div style={{ background: 'var(--surface2)', padding: '8px', borderRadius: '4px' }}>
                                        <strong style={{ color: 'var(--text2)', display: 'block', marginBottom: '3px' }}>Prescription & Treatment Plan:</strong>
                                        <span style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                                          {historyItem.prescription || 'No medicines prescribed.'}
                                        </span>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingRecordId(historyItem._id);
                                          setCurrentNotes(historyItem.clinicalNotes || '');
                                          setCurrentPrescription(historyItem.prescription || '');
                                        }}
                                        style={{
                                          background: 'var(--amber-light, #FEF3C7)',
                                          border: '1px solid var(--amber, #F59E0B)',
                                          color: 'var(--amber-dark, #B45309)',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        ✏️ Edit this Record
                                      </button>
                                      {hasItemRecord && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingRecordId(null);
                                            if (historyItem.clinicalNotes) setCurrentNotes(historyItem.clinicalNotes);
                                            if (historyItem.prescription) setCurrentPrescription(historyItem.prescription);
                                          }}
                                          style={{
                                            background: 'var(--surface2)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text)',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          📋 Copy to New Entry
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteEntry(historyItem._id)}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.08)',
                                          border: '1px solid rgba(239, 68, 68, 0.3)',
                                          color: 'var(--red)',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        🗑️ Delete Record
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
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
