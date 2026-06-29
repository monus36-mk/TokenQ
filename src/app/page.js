'use client';

import React, { useState, useEffect } from 'react';
import PhoneFrame from '@/components/PhoneFrame';
import PatientHome from '@/components/PatientHome';
import ClinicDetail from '@/components/ClinicDetail';
import BookingFlow from '@/components/BookingFlow';
import AdminDashboard from '@/components/AdminDashboard';

export default function Home() {
  const [viewMode, setViewMode] = useState('patient'); // 'patient' or 'admin'
  const [patientScreen, setPatientScreen] = useState('home'); // 'home', 'detail', 'book', 'token', 'tokens', 'profile'
  const [clinics, setClinics] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Phone number of the default logged-in patient (used to query bookings)
  const [userPhone, setUserPhone] = useState('+91 98765 43210');
  const [userName, setUserName] = useState('Kavitha Rajan');

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
      console.error('Error fetching data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter bookings for the active patient
  const userBookings = bookings.filter(b => b.patientPhone === userPhone);

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic);
    setPatientScreen('detail');
  };

  const handleStartBooking = () => {
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
    <main>
      <PhoneFrame>
        {/* VIEW SWITCHER */}
        <div className="vsw">
          <button 
            className={`vsw-btn ${viewMode === 'patient' ? 'active' : ''}`} 
            onClick={() => setViewMode('patient')}
          >
            🙋 Patient
          </button>
          <button 
            className={`vsw-btn ${viewMode === 'admin' ? 'active' : ''}`} 
            onClick={() => { setViewMode('admin'); fetchData(); }}
          >
            🏢 Admin
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', background: 'var(--surface)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏥</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Loading TokenQ...</div>
            </div>
          </div>
        ) : viewMode === 'patient' ? (
          /* ===== PATIENT WORKFLOW ===== */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: 'var(--surface)' }}>
            
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
              />
            )}

            {/* Screen 2: Clinic Detail */}
            {patientScreen === 'detail' && selectedClinic && (
              <ClinicDetail 
                clinic={selectedClinic}
                onBack={handleBackToHome}
                onStartBooking={handleStartBooking}
              />
            )}

            {/* Screen 3: Booking Flow (Time slot -> review -> checkout -> live tracking) */}
            {patientScreen === 'book' && selectedClinic && (
              <BookingFlow 
                clinic={selectedClinic}
                onBack={() => setPatientScreen('detail')}
                onBookingComplete={handleBookingComplete}
              />
            )}

            {/* Screen 4: Individual Token Live Tracking */}
            {patientScreen === 'token' && selectedToken && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="topbar">
                  <div className="back-btn" onClick={handleBackToHome}>←</div>
                  <div className="topbar-title">Live tracker</div>
                  <div className="pill pg" style={{ fontSize: '11px' }}>🏥 Clinic</div>
                </div>
                
                {(() => {
                  const clinic = clinics.find(c => c._id === selectedToken.clinicId) || {};
                  return (
                    <>
                      <div className="token-hero">
                        <div className="token-lbl">Your token</div>
                        <div className="token-num" style={{ color: 'var(--green-mid)' }}>
                          {selectedToken.tokenNumber}
                        </div>
                        <div className="token-clinic">
                          {clinic.name} · {selectedToken.slot}
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <span className="pill" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.85)' }}>
                            ✅ ₹{selectedToken.feePaid || 105} paid via UPI
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
                              <span className="qt-lbl" style={{ color: 'var(--amber)' }}>{selectedToken.tokenNumber}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '9px', textAlign: 'center' }}>
                                <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>7</div>
                                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>ahead</div>
                              </div>
                              <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '9px', textAlign: 'center' }}>
                                <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--amber)' }}>
                                  {clinic.delayMinutes > 0 ? `~${35 + clinic.delayMinutes}m` : '~35m'}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>est. wait</div>
                              </div>
                              <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '9px', textAlign: 'center' }}>
                                <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--blue)' }}>6 min</div>
                                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>to reach</div>
                              </div>
                            </div>
                          </div>

                          <div className="alert alert-a">
                            <span style={{ fontSize: '18px' }}>🔔</span>
                            <div className="alert-txt">
                              <strong>Smart alert active</strong>
                              You'll be notified when 3 are ahead. Leave then — arrive just in time.
                            </div>
                          </div>

                          {clinic.delayMinutes > 0 && (
                            <div className="alert alert-b">
                              <span style={{ fontSize: '18px' }}>⏱️</span>
                              <div className="alert-txt">
                                <strong>Doctor delayed +{clinic.delayMinutes} min</strong>
                                Session running late due to previous surgery. Wait times adjusted.
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

            {/* Screen 5: My Tokens List (Active & Past) */}
            {patientScreen === 'tokens' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
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
                              <button onClick={() => alert('Booking cancelled. Refund of ₹105 initiated.')} style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', border: 'none', borderRadius: '7px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', cursor: 'pointer' }}>
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
                    
                    {/* Mock static completed booking */}
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
                
                {/* Navigation */}
                <div className="bottom-nav">
                  <div className="bnav" onClick={() => onNavigate('home')}><div className="bnav-icon">🏠</div>Home</div>
                  <div className="bnav" onClick={() => onNavigate('home')}><div className="bnav-icon">🔍</div>Search</div>
                  <div className="bnav active"><div class="bnav-icon">🎟️</div>Tokens</div>
                  <div className="bnav" onClick={() => onNavigate('profile')}><div className="bnav-icon">👤</div>Profile</div>
                </div>
              </div>
            )}

            {/* Screen 5: Profile Panel */}
            {patientScreen === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="topbar"><div className="topbar-title">My profile</div></div>
                <div className="scrollable">
                  <div className="pad">
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                      <div style={{ width: '62px', height: '62px', borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>👩</div>
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>{userName}</div>
                        <input 
                          type="text"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="Phone number"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            fontSize: '13px',
                            color: 'var(--text2)',
                            width: '100%',
                            outline: 'none',
                            borderBottom: '1px dashed var(--border2)'
                          }}
                        />
                        <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>Thanjavur, Tamil Nadu</div>
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
                    <button className="btn-s" style={{ marginBottom: '18px' }} onClick={() => alert('Feature coming soon in Next.js build!')}>+ Add family member</button>

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
                      <div className="irow" style={{ cursor: 'pointer' }}><span className="ilabel" style={{ color: 'var(--red)' }}>🚪 Logout</span></div>
                    </div>
                    
                    <div style={{ height: '16px' }}></div>
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="bottom-nav">
                  <div className="bnav" onClick={() => onNavigate('home')}><div className="bnav-icon">🏠</div>Home</div>
                  <div className="bnav" onClick={() => onNavigate('home')}><div className="bnav-icon">🔍</div>Search</div>
                  <div className="bnav" onClick={() => onNavigate('tokens')}><div className="bnav-icon">🎟️</div>Tokens</div>
                  <div className="bnav active"><div className="bnav-icon">👤</div>Profile</div>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* ===== ADMIN WORKFLOW ===== */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: 'var(--surface)' }}>
            <AdminDashboard 
              clinics={clinics}
              bookings={bookings}
              onRefresh={fetchData}
            />
          </div>
        )}
      </PhoneFrame>
    </main>
  );
}
