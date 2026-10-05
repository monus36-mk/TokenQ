import React, { useState } from 'react';

export default function PatientProfile({
  currentUser,
  userBookings,
  clinics,
  onNavigate,
  onLogout,
  onSelectClinic,
  onUpdateUser
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    age: currentUser?.age || '',
    gender: currentUser?.gender || 'M',
    city: currentUser?.city || 'Thanjavur',
    bloodGroup: currentUser?.bloodGroup || '',
    emergencyContact: currentUser?.emergencyContact || '',
    allergies: currentUser?.allergies || '',
    medicalConditions: currentUser?.medicalConditions || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [savedClinicIds, setSavedClinicIds] = useState(() => {
    try {
      const saved = localStorage.getItem('tokenq_saved_clinics');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const savedClinics = clinics.filter(c => savedClinicIds.includes(c._id));

  const completedCount = userBookings.filter(b => b.status === 'done').length;
  const rxCount = userBookings.filter(b => Boolean(b.prescription || (b.medicines && b.medicines.length > 0))).length;
  const upcomingFollowUpCount = userBookings.filter(b => {
    if (!b.followUpDate) return false;
    return new Date(b.followUpDate) >= new Date(Date.now() - 24 * 60 * 60 * 1000);
  }).length;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Update locally
      const updated = {
        ...currentUser,
        ...formData
      };
      localStorage.setItem('tokenq_user', JSON.stringify(updated));
      if (onUpdateUser) onUpdateUser(updated);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      setIsEditing(false);
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', maxWidth: '1050px', margin: '0 auto', padding: '0 16px' }}>
      
      {/* Top Header */}
      <div className="topbar">
        <div className="topbar-title">My Health Profile</div>
        {currentUser && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            style={{
              background: isEditing ? 'var(--surface2)' : 'var(--green-light)',
              color: isEditing ? 'var(--text)' : 'var(--green-dark)',
              border: '1px solid var(--green)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isEditing ? 'Cancel' : '✏️ Edit Profile'}
          </button>
        )}
      </div>

      <div className="scrollable">
        <div className="pad">

          {/* Guest Sign-In Banner */}
          {!currentUser && (
            <div style={{
              background: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E40AF' }}>
                  👋 Sign in to sync your profile
                </div>
                <div style={{ fontSize: '12px', color: '#3B82F6', marginTop: '2px' }}>
                  Access your prescriptions, active tokens, and checkup reminders on any device.
                </div>
              </div>
              <button
                onClick={() => onNavigate('auth')}
                style={{
                  background: '#1D4ED8',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Sign In →
              </button>
            </div>
          )}

          {savedSuccess && (
            <div className="alert alert-g" style={{ marginBottom: '14px', borderLeft: '4px solid var(--green)' }}>
              <span>✅</span>
              <div className="alert-txt">Profile details updated successfully!</div>
            </div>
          )}

          {/* User Profile Card */}
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: currentUser ? 'linear-gradient(135deg, #10B981, #059669)' : 'var(--surface2)',
                color: currentUser ? 'white' : 'var(--text2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 700,
                flexShrink: 0,
                boxShadow: currentUser ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'none'
              }}>
                {currentUser ? (currentUser.gender === 'F' ? '👩' : '👨') : '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                  {currentUser?.name || 'Guest User'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>
                  📱 {currentUser?.phone || 'Not signed in'}
                </div>
                {currentUser?.email && (
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px' }}>
                    ✉️ {currentUser.email}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{currentUser?.city || 'Thanjavur'}, Tamil Nadu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '18px' }}>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>{userBookings.length}</div>
              <div style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: 600 }}>Total Visits</div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--green-dark)' }}>{completedCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: 600 }}>Completed</div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#0284c7' }}>{rxCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: 600 }}>Digital Rx</div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#d97706' }}>{upcomingFollowUpCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: 600 }}>Checkups</div>
            </div>
          </div>

          {/* Edit Profile Form if open */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1.5px solid var(--green)',
              padding: '16px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border2)', paddingBottom: '6px' }}>
                ✏️ Edit Personal & Health Information
              </div>

              <div>
                <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--surface2)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--surface2)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--surface2)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--surface2)', fontSize: '13px' }}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Emergency Contact</label>
                  <input
                    type="tel"
                    placeholder="Parent / Spouse phone"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--surface2)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label className="fl" style={{ fontSize: '11px', color: 'var(--text2)' }}>Known Allergies / Health Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin allergy, Diabetic"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--surface2)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-p"
                  style={{ flex: 1, padding: '9px', fontSize: '13px', background: 'var(--green-dark)' }}
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes ✓'}
                </button>
                <button
                  type="button"
                  className="btn-s"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '9px 14px', fontSize: '13px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Medical Profile Summary Card */}
          <div className="sec-label">Medical & Health Details</div>
          <div className="card" style={{ cursor: 'default', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Blood Group</div>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                  {currentUser?.bloodGroup || 'Not specified'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Emergency Contact</div>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                  {currentUser?.emergencyContact || 'Not specified'}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Known Allergies / Health Conditions</div>
                <div style={{ fontWeight: 500, color: 'var(--text)', marginTop: '2px' }}>
                  {currentUser?.allergies || currentUser?.medicalConditions || 'None recorded'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts to Features */}
          <div className="sec-label">Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div 
              className="card"
              onClick={() => onNavigate('prescriptions')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>💊</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Digital Prescriptions & Rx</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>View doctor advice, medicines, and checkup reminders</div>
                </div>
              </div>
              <span style={{ color: 'var(--text3)' }}>→</span>
            </div>

            <div 
              className="card"
              onClick={() => onNavigate('tokens')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🎫</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Tokens & Booking History</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Track active queue or review past consultations</div>
                </div>
              </div>
              <span style={{ color: 'var(--text3)' }}>→</span>
            </div>

            <div 
              className="card"
              onClick={() => onNavigate('notifications')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🔔</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Notification Center</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Follow-up reminders, queue alerts, and clinic notices</div>
                </div>
              </div>
              <span style={{ color: 'var(--text3)' }}>→</span>
            </div>
          </div>

          {/* Saved clinics */}
          <div className="sec-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Saved Clinics ({savedClinics.length})</span>
            {savedClinics.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Tap clinic to open</span>
            )}
          </div>

          {savedClinics.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {savedClinics.map(c => (
                <div 
                  key={c._id}
                  className="card" 
                  onClick={() => onSelectClinic(c)} 
                  style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                      {c.icon || '🏥'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{c.address} · {c.rating || 5} ⭐</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = savedClinicIds.filter(id => id !== c._id);
                      setSavedClinicIds(updated);
                      localStorage.setItem('tokenq_saved_clinics', JSON.stringify(updated));
                    }}
                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px' }}
                    title="Remove from saved clinics"
                  >
                    ❤️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)',
              padding: '20px 16px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>🤍</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>No Saved Clinics</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px', maxWidth: '300px', margin: '2px auto 10px' }}>
                You haven&apos;t saved any clinics yet. Tap the save button on any clinic to keep quick bookmarks here.
              </div>
              <button
                onClick={() => onNavigate('home')}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Browse Clinics →
              </button>
            </div>
          )}

          {/* Account & Settings */}
          <div className="sec-label">Account Settings</div>
          <div className="ilist" style={{ marginBottom: '24px' }}>
            <div className="irow" style={{ cursor: 'pointer' }}>
              <span className="ilabel">🔔 Push & In-app Alerts</span>
              <span className="ival" style={{ color: 'var(--green-dark)' }}>Enabled</span>
            </div>
            <div className="irow" style={{ cursor: 'pointer' }}>
              <span className="ilabel">🌐 Language</span>
              <span className="ival">English / தமிழ்</span>
            </div>
            {currentUser ? (
              <div className="irow" style={{ cursor: 'pointer' }} onClick={onLogout}>
                <span className="ilabel" style={{ color: 'var(--red)', fontWeight: 600 }}>🚪 Logout Account</span>
              </div>
            ) : (
              <div className="irow" style={{ cursor: 'pointer' }} onClick={() => onNavigate('auth')}>
                <span className="ilabel" style={{ color: 'var(--green-dark)', fontWeight: 600 }}>🔑 Sign In / Create Account</span>
                <span className="ival" style={{ color: 'var(--green-dark)' }}>→</span>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
