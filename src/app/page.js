'use client';

import React, { useState, useEffect } from 'react';
import PatientHome from '@/components/PatientHome';
import ClinicDetail from '@/components/ClinicDetail';
import BookingFlow from '@/components/BookingFlow';
import AdminDashboard from '@/components/AdminDashboard';
import AuthScreens from '@/components/AuthScreens';

export default function Home() {
  const [viewMode, setViewMode] = useState('patient'); // 'patient' or 'admin'
  const [patientScreen, setPatientScreen] = useState('home'); // 'home', 'detail', 'book', 'token', 'tokens', 'profile'
  const [clinics, setClinics] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');

  // Check persistent session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('tokenq_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        if (user.role === 'admin' || user.role === 'clinic-admin') {
          setViewMode('admin');
        } else {
          setViewMode('patient');
        }
        setUserPhone(user.phone || '');
        setUserName(user.name);
      } catch (e) {
        console.error('Error parsing saved session:', e);
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      // Fetch clinics
      const clinicsRes = await fetch('/api/clinics');
      const clinicsJson = await clinicsRes.json();
      if (clinicsJson.success) {
        setClinics(clinicsJson.data);
      }

      // Fetch all bookings (so admin can see everything)
      const bookingsRes = await fetch('/api/bookings');
      const bookingsJson = await bookingsRes.json();
      if (bookingsJson.success) {
        setBookings(bookingsJson.data);
      }
    } catch (e) {
      console.warn('Error fetching data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync selectedToken with background updates
  useEffect(() => {
    if (selectedToken) {
      const updated = bookings.find(b => b._id === selectedToken._id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedToken)) {
        setSelectedToken(updated);
      }
    }
  }, [bookings, selectedToken]);

  // Filter bookings for the active patient
  const userBookings = bookings.filter(b => {
    if (b.userId && currentUser?._id) {
      return b.userId === currentUser._id;
    }
    return b.patientPhone === userPhone;
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.role === 'admin' || user.role === 'clinic-admin') {
      setViewMode('admin');
    } else {
      setViewMode('patient');
    }
    setUserPhone(user.phone || '');
    setUserName(user.name);
    localStorage.setItem('tokenq_user', JSON.stringify(user));
    setPatientScreen('home');
    fetchData();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserPhone('');
    setUserName('');
    localStorage.removeItem('tokenq_user');
    setPatientScreen('home'); // Reset screen state
    setViewMode('patient'); // Default back to patient
  };

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic);
    setPatientScreen('detail');
  };

  const handleStartBooking = (doctor) => {
    setSelectedDoctor(doctor);
    setPatientScreen('book');
  };

  const handleBookingComplete = (newBooking) => {
    // Add new booking to local list immediately and trigger data sync
    setBookings(prev => [newBooking, ...prev]);
    setSelectedToken(newBooking);
    setPatientScreen('token'); // Go directly to live tracking of the confirmed token
    fetchData();
  };

  const handleSelectToken = (token) => {
    setSelectedToken(token);
    setPatientScreen('token');
  };

  const handleNavigate = (screen) => {
    setPatientScreen(screen);
  };

  const handleBackToHome = () => {
    setPatientScreen('home');
  };

  // Helper star rating mockup
  const [ratings, setRatings] = useState({ 'stars-1': 5 });
  const handleRateStar = (id, rating) => {
    setRatings(prev => ({ ...prev, [id]: rating }));
    alert(`Thank you for rating! You gave ${rating} stars.`);
  };

  return (
    <main className="app-container">
      {isLoading ? (
        <div style={{ display: 'flex', flex: 1, height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', background: 'var(--bg)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏥</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Loading TokenQ...</div>
          </div>
        </div>
      ) : viewMode === 'patient' ? (
        /* ===== PATIENT WORKFLOW ===== */
        <div className="patient-layout-wrap">
          
          {!isLoggedIn ? (
            /* LOGIN / SIGNUP SCREENS */
            <AuthScreens 
              onLoginSuccess={handleLoginSuccess}
            />
          ) : (
            /* REGISTERED FLOWS */
            <>
              {/* Screen 1: Home List */}
              {patientScreen === 'home' && (
                <PatientHome 
                  clinics={clinics}
                  userBookings={userBookings}
                  onSelectClinic={handleSelectClinic}
                  onSelectToken={handleSelectToken}
                  onNavigate={handleNavigate}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  currentUser={currentUser}
                />
              )}

              {/* Screen 2: Clinic Detail */}
              {patientScreen === 'detail' && selectedClinic && (
                <ClinicDetail 
                  clinic={selectedClinic}
                  onBack={handleBackToHome}
                  onStartBooking={handleStartBooking}
                  currentUser={currentUser}
                  onReviewAdded={(updatedClinic) => {
                    setClinics(prev => prev.map(c => c._id === updatedClinic._id ? updatedClinic : c));
                    setSelectedClinic(updatedClinic);
                  }}
                />
              )}

              {/* Screen 3: Booking Flow */}
              {patientScreen === 'book' && selectedClinic && (
                <BookingFlow 
                  clinic={selectedClinic}
                  doctor={selectedDoctor}
                  onBack={() => setPatientScreen('detail')}
                  onBookingComplete={handleBookingComplete}
                  currentUser={currentUser}
                />
              )}

              {/* Screen 4: Live Tracker */}
              {patientScreen === 'token' && selectedToken && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh' }}>
                  <div className="topbar">
                    <div className="back-btn" onClick={handleBackToHome}>←</div>
                    <div className="topbar-title">Live tracker</div>
                    <div className="pill pg" style={{ fontSize: '11px' }}>🏥 Clinic</div>
                  </div>
                  {(() => {
                    const clinic = clinics.find(c => c._id === selectedToken.clinicId) || {};
                    const doctorBookings = bookings.filter(b => b.clinicId === selectedToken.clinicId && b.doctorName === selectedToken.doctorName);
                    const servingBooking = doctorBookings.find(b => b.status === 'serving');
                    const nowServingToken = servingBooking ? servingBooking.tokenNumber : 'None';
                    const activeBefore = doctorBookings.filter(b => 
                      (b.status === 'waiting' || b.status === 'serving') && 
                      new Date(b.createdAt) < new Date(selectedToken.createdAt)
                    );
                    const waitingAhead = selectedToken.status === 'serving' 
                      ? 0 
                      : activeBefore.length;
                    const selectedDocInfo = clinic.doctors?.find(d => d.name === selectedToken.doctorName);
                    const docDelay = selectedDocInfo?.delayMinutes || 0;
                    
                    const estWaitMin = selectedToken.status === 'serving' 
                      ? 0 
                      : (waitingAhead * 10) + docDelay;

                    return (
                      <>
                        <div className="token-hero">
                          <div className="token-lbl">Your token ({selectedToken.doctorName})</div>
                          <div className="token-num" style={{ color: 'var(--green-mid)' }}>
                            {selectedToken.tokenNumber}
                          </div>
                          <div className="token-clinic">
                            {clinic.name} · {selectedToken.slot}
                          </div>
                          <div style={{ marginTop: '12px' }}>
                            <span className="pill" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.85)' }}>
                              💵 Fee: ₹{clinic.fee || 100} (Pay at Clinic)
                            </span>
                          </div>
                        </div>

                        <div className="scrollable">
                          <div className="pad">
                            <div className="sec-label">Live queue tracker</div>
                            <div className="qtracker">
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Now serving</span>
                                <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Your token</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '11px' }}>
                                <span className="qt-lbl" style={{ color: 'var(--green-dark)' }}>{nowServingToken}</span>
                                <div style={{ flex: 1, height: '2px', background: 'var(--border2)', margin: '0 12px' }}></div>
                                <span className="qt-lbl" style={{ color: 'var(--amber)' }}>{selectedToken.tokenNumber}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '9px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>{waitingAhead}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>ahead</div>
                                </div>
                                <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '9px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--amber)' }}>
                                    {selectedToken.status === 'serving' ? 'Serving' : estWaitMin === 0 ? 'Ready / No wait' : `~${estWaitMin}m`}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>est. wait</div>
                                </div>
                              </div>
                            </div>
 
                             {selectedToken.status === 'serving' ? (
                               <div className="alert alert-a" style={{ borderLeftColor: 'var(--green)' }}>
                                 <span style={{ fontSize: '18px' }}>🏥</span>
                                 <div className="alert-txt">
                                   <strong>It is your turn now!</strong>
                                   Please enter the doctor's consulting room.
                                 </div>
                               </div>
                             ) : waitingAhead === 0 ? (
                               <div className="alert alert-a" style={{ borderLeftColor: 'var(--green)' }}>
                                 <span style={{ fontSize: '18px' }}>🏥</span>
                                 <div className="alert-txt">
                                   <strong>You are next in line!</strong>
                                   Please stand near the doctor's cabin. You will be called in a moment.
                                 </div>
                               </div>
                             ) : waitingAhead < 5 ? (
                               <div className="alert alert-a" style={{ borderLeftColor: 'var(--amber)' }}>
                                 <span style={{ fontSize: '18px' }}>🏥</span>
                                 <div className="alert-txt">
                                   <strong>Wait at the clinic</strong>
                                   Only {waitingAhead} patient(s) ahead of you. Please remain in the clinic waiting hall.
                                 </div>
                               </div>
                             ) : (
                               <div className="alert alert-a" style={{ borderLeftColor: 'var(--green)' }}>
                                 <span style={{ fontSize: '18px' }}>🏡</span>
                                 <div className="alert-txt">
                                   <strong>Wait at home comfortably</strong>
                                   You have {waitingAhead} patients ahead. We'll alert you when 3 are left to leave home.
                                 </div>
                               </div>
                             )}
 
                            {docDelay > 0 && (
                              <div className="alert alert-b">
                                <span style={{ fontSize: '18px' }}>⏱️</span>
                                <div className="alert-txt">
                                  <strong>Doctor delayed +{docDelay} min</strong>
                                  Session running late. Wait times adjusted.
                                </div>
                              </div>
                            )}
 
                            <button className="btn-s" onClick={handleBackToHome}>← Back to home</button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Screen 5: My Tokens List */}
              {patientScreen === 'tokens' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh' }}>
                  <div className="topbar">
                    <div className="topbar-title">My tokens</div>
                  </div>
                  <div className="scrollable">
                    <div className="pad">
                      <div className="sec-label">Active</div>
                      
                      {userBookings.filter(b => b.status === 'waiting' || b.status === 'serving').length > 0 ? (
                        userBookings.filter(b => b.status === 'waiting' || b.status === 'serving').map(booking => {
                          const clinic = clinics.find(c => c._id === booking.clinicId) || {};
                          return (
                            <div 
                              key={booking._id} 
                              style={{ background: 'var(--text)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: '10px', color: 'white' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', marginBottom: '3px' }}>🏥 Clinic · Today {booking.slot}</div>
                                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{clinic.name}</div>
                                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.55)', marginTop: '1px' }}>{clinic.address}</div>
                                </div>
                                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '26px', fontWeight: 500, color: 'var(--green-mid)' }}>
                                  {booking.tokenNumber}
                                </div>
                              </div>
                              <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: '8px', padding: '11px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,.5)', marginBottom: '6px' }}>
                                  <span>Now serving</span>
                                  <span>Your token</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px', fontWeight: 600, color: 'var(--green-mid)' }}>A-12</span>
                                  <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
                                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--green)' }}></div>
                                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--green)' }}></div>
                                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,.2)' }}></div>
                                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,.2)' }}></div>
                                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,.2)' }}></div>
                                  </div>
                                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>{booking.tokenNumber}</span>
                                </div>
                              </div>
                              <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleSelectToken(booking)} style={{ flex: 1, padding: '9px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '7px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                  Track live →
                                  </button>
                                <button onClick={() => alert('Booking cancelled. Refund initiated.')} style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', border: 'none', borderRadius: '7px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', cursor: 'pointer' }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '30px', textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius)', color: 'var(--text2)', fontSize: '13px', marginBottom: '20px' }}>
                          No active tokens. Book a clinic above to start tracking.
                        </div>
                      )}

                      <div className="sec-label">Past bookings</div>
                      
                      <div className="card" style={{ cursor: 'default' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Dr. Ramesh General Clinic</div>
                            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>Yesterday · Token A-08 · Fever, cold</div>
                          </div>
                          <span className="pill pg">Done</span>
                        </div>
                        <div style={{ marginTop: '9px', paddingTop: '9px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Rate your experience</div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <span 
                                key={star}
                                onClick={() => handleRateStar('stars-1', star)} 
                                style={{ fontSize: '21px', cursor: 'pointer', opacity: star <= (ratings['stars-1'] || 0) ? '1' : '.3' }}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="card" style={{ cursor: 'default' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Sakthi Paediatric Clinic</div>
                            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>Last week · Token C-22 · Anjali (daughter)</div>
                          </div>
                          <span className="pill pr">Cancelled</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '7px' }}>Refund of ₹125 credited</div>
                      </div>

                    </div>
                  </div>
                  

                </div>
              )}

              {/* Screen 6: Profile Panel */}
              {patientScreen === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh' }}>
                  <div className="topbar"><div className="topbar-title">My profile</div></div>
                  <div className="scrollable">
                    <div className="pad">
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                        <div style={{ width: '62px', height: '62px', borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>👩</div>
                        <div>
                          <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>{userName}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{userPhone}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>Thanjavur, Tamil Nadu</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
                        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '11px', textAlign: 'center' }}>
                          <div style={{ fontSize: '19px', fontWeight: 600, color: 'var(--text)' }}>{userBookings.length}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Bookings</div>
                        </div>
                        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '11px', textAlign: 'center' }}>
                          <div style={{ fontSize: '19px', fontWeight: 600, color: 'var(--green)' }}>
                            {userBookings.filter(b => b.status === 'done').length}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Completed</div>
                        </div>
                        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '11px', textAlign: 'center' }}>
                          <div style={{ fontSize: '19px', fontWeight: 600, color: 'var(--purple)' }}>1</div>
                          <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Saved</div>
                        </div>
                      </div>

                      <div className="sec-label">Family members</div>
                      <div className="card" style={{ cursor: 'default', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👧</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Anjali</div>
                            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Daughter · 4 yrs · Female</div>
                          </div>
                          <span className="pill pgr">Saved</span>
                        </div>
                      </div>
                      <button className="btn-s" style={{ marginBottom: '18px' }} onClick={() => alert('Add family member coming soon!')}>+ Add family member</button>

                      <div className="sec-label">Saved places</div>
                      {clinics[0] && (
                        <div className="card" onClick={() => handleSelectClinic(clinics[0])} style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏥</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{clinics[0].name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{clinics[0].address} · {clinics[0].rating} ⭐</div>
                            </div>
                            <span style={{ fontSize: '18px' }}>❤️</span>
                          </div>
                        </div>
                      )}

                      <div className="sec-label">Account settings</div>
                      <div className="ilist">
                        <div className="irow" style={{ cursor: 'pointer' }}><span className="ilabel">🔔 Notifications</span><span className="ival" style={{ color: 'var(--green)' }}>On</span></div>
                        <div className="irow" style={{ cursor: 'pointer' }}><span className="ilabel">🌐 Language</span><span className="ival">English / தமிழ்</span></div>
                        <div className="irow" style={{ cursor: 'pointer' }} onClick={handleLogout}><span className="ilabel" style={{ color: 'var(--red)' }}>🚪 Logout</span></div>
                      </div>
                      
                      <div style={{ height: '16px' }}></div>
                    </div>
                  </div>


                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ===== ADMIN WORKFLOW ===== */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', maxWidth: '1000px', margin: '0 auto', background: 'var(--surface)', minHeight: '100vh', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
          <AdminDashboard 
            clinics={clinics}
            bookings={bookings}
            onRefresh={fetchData}
            onLogout={handleLogout}
            currentUser={currentUser}
          />
        </div>
      )}
    </main>
  );
}
