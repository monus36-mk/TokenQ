import React, { useState } from 'react';

export default function AdminDashboard({ clinics, bookings, onRefresh }) {
  const [selectedClinicId, setSelectedClinicId] = useState(clinics[0]?._id || '');
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'requests', 'controls'

  const clinic = clinics.find(c => c._id === selectedClinicId) || clinics[0] || {};
  const clinicBookings = bookings.filter(b => b.clinicId === selectedClinicId);

  // Stats calculation
  const booked = clinicBookings.length;
  const done = clinicBookings.filter(b => b.status === 'done').length;
  const waiting = clinicBookings.filter(b => b.status === 'waiting').length;
  const serving = clinicBookings.filter(b => b.status === 'serving').length;
  const cancelled = clinicBookings.filter(b => b.status === 'cancelled').length;

  const currentServingPatient = clinicBookings.find(b => b.status === 'serving');
  const queuePatients = clinicBookings.filter(b => b.status === 'waiting');

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
    alert(`Doctor delayed by 30 mins. All waiting patients notified via SMS.`);
  };

  const handleToggleUnavailable = () => {
    const isUnavail = !clinic.isUnavailable;
    handleAdminAction({ action: 'toggleUnavailable', isUnavailable: isUnavail });
    alert(isUnavail ? 'Clinic marked Closed today. Remaining tokens refunded.' : 'Clinic marked Open.');
  };

  // Mock specialty requests for demonstration
  const [requestsList, setRequestsList] = useState([
    { id: 'req_1', name: 'Vijay Kumar', age: 58, gender: 'M', complaint: 'Chest pain for 2 days', severity: 'Severe', time: '9:00 AM' },
    { id: 'req_2', name: 'Anjali R.', age: 4, gender: 'F', complaint: 'High fever for 3 days, vomiting', severity: 'Moderate', time: '9:00 AM' },
    { id: 'req_3', name: 'Meena S.', age: 34, gender: 'F', complaint: 'Skin rash spreading', severity: 'Mild', time: '9:30 AM' }
  ]);

  const handleAcceptRequest = (id, name, time) => {
    setRequestsList(prev => prev.filter(r => r.id !== id));
    alert(`Specialist request accepted for ${name} at ${time}. Token generated.`);
  };

  const handleRejectRequest = (id, name) => {
    setRequestsList(prev => prev.filter(r => r.id !== id));
    alert(`Specialist request rejected for ${name}. Refund initiated.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      
      {/* ADMIN HEADER */}
      <div className="admin-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <div className="admin-name">{clinic.name}</div>
            <div className="admin-sub">🏥 {clinic.specialty} · {clinic.timings} · Today</div>
          </div>
          <div>
            {/* Dropdown to switch clinic admin view */}
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
          </div>
        </div>
        
        {/* Top Mini Stats */}
        <div className="stat-grid4">
          <div className="stat4">
            <div className="stat4-num">{booked}</div>
            <div className="stat4-lbl">Booked</div>
          </div>
          <div className="stat4">
            <div className="stat4-num" style={{ color: 'var(--green-mid)' }}>{done}</div>
            <div className="stat4-lbl">Done</div>
          </div>
          <div className="stat4">
            <div className="stat4-num" style={{ color: '#FBBF24' }}>{requestsList.length}</div>
            <div className="stat4-lbl">Requests</div>
          </div>
          <div className="stat4">
            <div className="stat4-num" style={{ color: '#FDA4A4' }}>{cancelled}</div>
            <div className="stat4-lbl">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="admin-tabs">
        <div 
          className={`atab ${activeTab === 'queue' ? 'active' : ''}`} 
          onClick={() => setActiveTab('queue')}
        >
          Live queue ({waiting + serving})
        </div>
        <div 
          className={`atab ${activeTab === 'requests' ? 'active' : ''}`} 
          onClick={() => setActiveTab('requests')}
        >
          Requests ({requestsList.length})
        </div>
        <div 
          className={`atab ${activeTab === 'controls' ? 'active' : ''}`} 
          onClick={() => setActiveTab('controls')}
        >
          Controls
        </div>
      </div>

      {/* Scrollable Container */}
      <div className="scrollable">
        <div className="pad">
          
          {/* QUEUE TAB */}
          {activeTab === 'queue' && (
            <div>
              <div className="sec-label">Currently serving</div>
              {currentServingPatient ? (
                <div style={{ background: 'var(--green-light)', borderRadius: 'var(--radius)', padding: '13px 15px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                  <button className="btn-done" onClick={() => handleMarkDone(currentServingPatient._id)}>Done ✓</button>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius)', color: 'var(--text2)', marginBottom: '14px', fontSize: '13px' }}>
                  No patient is currently being serving. Click "Done" on the previous patient or select from waiting.
                </div>
              )}

              <div className="sec-label">Queue ({queuePatients.length} waiting)</div>
              {queuePatients.length > 0 ? (
                queuePatients.map((patient, index) => {
                  // Mock distance display
                  const labels = ['Waiting', 'Travelling', 'At home'];
                  const styles = ['pa', 'pb', 'pgr']; // yellow, blue, grey
                  const indexStyle = index === 0 ? 0 : index < 3 ? 1 : 2; 

                  return (
                    <div key={patient._id} className="qi" style={{ cursor: 'pointer' }} onClick={() => handleAdminAction({ action: 'updateBookingStatus', bookingId: patient._id, status: 'serving' })}>
                      <div className="tkbadge" style={{ background: indexStyle === 0 ? 'var(--amber-light)' : indexStyle === 1 ? 'var(--blue-light)' : 'var(--surface2)', color: indexStyle === 0 ? 'var(--amber)' : indexStyle === 1 ? 'var(--blue)' : 'var(--text2)' }}>
                        {patient.tokenNumber}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="qi-name">{patient.patientName}</div>
                        <div className="qi-det">
                          {patient.visitType === 'new' ? 'New' : 'BP Follow-up'} · {patient.slot} · {patient.complaints?.join(', ') || 'Consultation'}
                        </div>
                      </div>
                      <span className={`pill ${styles[indexStyle]}`}>{indexStyle === 0 ? 'Next Up' : labels[indexStyle]}</span>
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

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div>
              <div className="alert alert-b">
                <span>ℹ️</span>
                <div className="alert-txt">
                  <strong>Auto-confirmed bookings</strong>
                  Standard clinic tokens confirm automatically. Special specialist request files are approved manually here.
                </div>
              </div>
              
              {requestsList.length > 0 ? (
                requestsList.map(req => (
                  <div key={req.id} className="card" style={{ cursor: 'default', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: req.severity === 'Severe' ? 'var(--red-light)' : 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: req.severity === 'Severe' ? 'var(--red)' : 'var(--blue)', flexShrink: 0, fontSize: '13px' }}>
                        {req.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                          {req.name}, {req.age} {req.gender}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)', margin: '3px 0' }}>
                          Specialty consultation · {req.time} · {req.complaint} · <strong style={{ color: req.severity === 'Severe' ? 'var(--red)' : 'var(--amber)' }}>{req.severity}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '7px', marginTop: '8px' }}>
                          <button className="btn-acc" onClick={() => handleAcceptRequest(req.id, req.name, req.time)}>✓ Accept</button>
                          <button className="btn-rej" onClick={() => handleRejectRequest(req.id, req.name)}>✗ Reject</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
                  No pending specialist requests.
                </div>
              )}
            </div>
          )}

          {/* CONTROLS TAB */}
          {activeTab === 'controls' && (
            <div>
              <div className="sec-label">Today's limit</div>
              <div className="ctrl-card">
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

              <div className="ctrl-card">
                <div className="ctrl-title">Schedule</div>
                <div className="ilist">
                  <div className="irow">
                    <span className="ilabel">Morning session</span>
                    <span className="ival" style={{ color: 'var(--green-dark)' }}>{clinic.timings}</span>
                  </div>
                  <div className="irow">
                    <span className="ilabel">Status</span>
                    <span className={`pill ${clinic.isUnavailable ? 'pr' : 'pg'}`}>
                      {clinic.isUnavailable ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sec-label">Quick actions</div>
              <button className="act-btn" onClick={() => alert('New bookings paused. Existing bookings remain active.')}>
                <div className="act-icon" style={{ background: 'var(--amber-light)' }}>⏸️</div>Pause new bookings
              </button>
              
              <button className="act-btn" onClick={handleAddDelay}>
                <div className="act-icon" style={{ background: 'var(--blue-light)' }}>⏱️</div>
                <span>Mark doctor delayed (+30 min)</span>
              </button>

              <button className="act-btn" onClick={handleToggleUnavailable}>
                <div className="act-icon" style={{ background: 'var(--surface2)' }}>🔴</div>
                <span>{clinic.isUnavailable ? 'Mark doctor available today' : 'Mark doctor unavailable today'}</span>
              </button>

              <button className="act-btn danger" onClick={() => confirm('Cancel all remaining slots? Refunds will be issued.') && alert('Slots cancelled. All patients notified.')}>
                <div className="act-icon" style={{ background: 'var(--red-light)' }}>❌</div>Cancel remaining slots
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
