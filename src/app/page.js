'use client';

import React, { useState, useEffect } from 'react';
import PatientHome from '@/components/PatientHome';
import ClinicDetail from '@/components/ClinicDetail';
import BookingFlow from '@/components/BookingFlow';
import AdminDashboard from '@/components/AdminDashboard';
import AuthScreens from '@/components/AuthScreens';
import BottomNav from '@/components/BottomNav';
import PatientNotifications from '@/components/PatientNotifications';
import PatientPrescriptionsList from '@/components/PatientPrescriptionsList';
import PatientProfile from '@/components/PatientProfile';
import PrescriptionViewer from '@/components/PrescriptionViewer';

export default function Home() {
  const [viewMode, setViewMode] = useState('patient'); // 'patient' or 'admin'
  const [patientScreen, setPatientScreen] = useState('home'); // 'home', 'detail', 'book', 'token', 'tokens', 'prescriptions', 'profile'
  const [clinics, setClinics] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Notification and Prescription Modals State
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState([]);
  const [dismissedNotifIds, setDismissedNotifIds] = useState([]);
  const [viewingRxBooking, setViewingRxBooking] = useState(null);

  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('tokenq_user');
      let key = 'guest';
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        key = u._id || (u.phone ? u.phone.replace(/\D/g, '').slice(-10) : 'user');
      }
      const savedRead = localStorage.getItem(`tokenq_read_notifs_${key}`) || localStorage.getItem('tokenq_read_notifs');
      if (savedRead) setReadNotifIds(JSON.parse(savedRead));
      const savedDismissed = localStorage.getItem(`tokenq_dismissed_notifs_${key}`) || localStorage.getItem('tokenq_dismissed_notifs');
      if (savedDismissed) setDismissedNotifIds(JSON.parse(savedDismissed));
    } catch (e) {}
  }, []);

  // Live Tracker completed rating states
  const [activeRating, setActiveRating] = useState(5);
  const [activeComment, setActiveComment] = useState('');
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [expandedPastTokenId, setExpandedPastTokenId] = useState(null);

  useEffect(() => {
    setIsRatingSubmitted(false);
    setIsRatingSubmitting(false);
    setActiveRating(5);
    setActiveComment('');
  }, [selectedToken?._id]);

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');

  // Pending routing states for history sync
  const [pendingClinicId, setPendingClinicId] = useState(null);
  const [pendingDoctorName, setPendingDoctorName] = useState(null);
  const [pendingTokenId, setPendingTokenId] = useState(null);

  // Check persistent session on mount
  useEffect(() => {
    // Force unregister any old Service Workers causing ChunkLoadError
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
          registration.unregister();
          console.log('Unregistered broken service worker');
        }
      }).catch(err => console.error('Error unregistering SW:', err));
    }

    const savedUser = localStorage.getItem('tokenq_user');
    let user = null;
    if (savedUser) {
      try {
        user = JSON.parse(savedUser);
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

    // URL Parsing for SPA back button and refresh support
    const params = new URLSearchParams(window.location.search);
    const screen = params.get('screen');
    if (screen) {
      const protectedScreens = ['book', 'token', 'tokens', 'profile'];
      if (protectedScreens.includes(screen) && !user) {
        setPatientScreen('home');
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        setPatientScreen(screen);
        const clinicId = params.get('clinicId');
        const doctorName = params.get('doctor');
        const tokenId = params.get('tokenId');
        if (clinicId) setPendingClinicId(clinicId);
        if (doctorName) setPendingDoctorName(doctorName);
        if (tokenId) setPendingTokenId(tokenId);
      }
    }
  }, []);

  const fetchData = async () => {
    console.log('fetchData called');
    try {
      // Fetch clinics
      console.log('Fetching clinics...');
      const clinicsRes = await fetch('/api/clinics', { cache: 'no-store' });
      console.log('Clinics response status:', clinicsRes.status);
      const clinicsJson = await clinicsRes.json();
      console.log('Clinics parsed:', clinicsJson.success);
      if (clinicsJson.success && Array.isArray(clinicsJson.data)) {
        const seenC = new Set();
        const uniqueClinics = clinicsJson.data.filter(c => {
          if (!c || !c._id) return true;
          const id = String(c._id);
          if (seenC.has(id)) return false;
          seenC.add(id);
          return true;
        });
        setClinics(uniqueClinics);
      }

      // Fetch all bookings (so admin can see everything)
      console.log('Fetching bookings...');
      const bookingsRes = await fetch('/api/bookings', { cache: 'no-store' });
      console.log('Bookings response status:', bookingsRes.status);
      const bookingsJson = await bookingsRes.json();
      console.log('Bookings parsed:', bookingsJson.success);
      if (bookingsJson.success && Array.isArray(bookingsJson.data)) {
        const seenB = new Set();
        const uniqueBookings = bookingsJson.data.filter(b => {
          if (!b || !b._id) return true;
          const id = String(b._id);
          if (seenB.has(id)) return false;
          seenB.add(id);
          return true;
        });
        setBookings(uniqueBookings);
      }
    } catch (e) {
      console.warn('Error fetching data:', e);
    } finally {
      console.log('Setting isLoading to false');
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
      const updated = bookings.find(b => String(b._id) === String(selectedToken._id));
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedToken)) {
        setSelectedToken(updated);
      }
    }
  }, [bookings, selectedToken]);

  // Sync viewingRxBooking with background updates
  useEffect(() => {
    if (viewingRxBooking) {
      const updated = bookings.find(b => String(b._id) === String(viewingRxBooking._id));
      if (updated && JSON.stringify(updated) !== JSON.stringify(viewingRxBooking)) {
        setViewingRxBooking(updated);
      }
    }
  }, [bookings, viewingRxBooking]);

  // Sync selectedClinic with background updates
  useEffect(() => {
    if (selectedClinic) {
      const updated = clinics.find(c => String(c._id) === String(selectedClinic._id));
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedClinic)) {
        setSelectedClinic(updated);
      }
    }
  }, [clinics, selectedClinic]);

  // History popstate listener for back button support
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const screen = params.get('screen') || 'home';
      const clinicId = params.get('clinicId');
      const doctorName = params.get('doctor');
      const tokenId = params.get('tokenId');

      setPatientScreen(screen);
      if (clinicId) {
        setPendingClinicId(clinicId);
      } else {
        setSelectedClinic(null);
        setPendingClinicId(null);
      }
      if (doctorName) {
        setPendingDoctorName(doctorName);
      } else {
        setSelectedDoctor(null);
        setPendingDoctorName(null);
      }
      if (tokenId) {
        setPendingTokenId(tokenId);
      } else {
        setSelectedToken(null);
        setPendingTokenId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Resolve pending entities when clinics load
  useEffect(() => {
    if (pendingClinicId && clinics.length > 0) {
      const clinic = clinics.find(c => c._id === pendingClinicId);
      if (clinic) {
        setSelectedClinic(clinic);
        setPendingClinicId(null);
        if (pendingDoctorName) {
          const doc = clinic.doctors?.find(d => d.name === pendingDoctorName);
          if (doc) {
            setSelectedDoctor(doc);
            setPendingDoctorName(null);
          }
        }
      }
    }
  }, [pendingClinicId, clinics, pendingDoctorName]);

  // Resolve pending tokens when bookings load
  useEffect(() => {
    if (pendingTokenId && bookings.length > 0) {
      const token = bookings.find(b => b._id === pendingTokenId);
      if (token) {
        setSelectedToken(token);
        setPendingTokenId(null);
      }
    }
  }, [pendingTokenId, bookings]);

  // Helper to push history state to URL search params
  const pushStateToHistory = (screen, clinicId = null, doctorName = null, tokenId = null) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    params.set('screen', screen);
    if (clinicId) params.set('clinicId', clinicId);
    if (doctorName) params.set('doctor', doctorName);
    if (tokenId) params.set('tokenId', tokenId);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      window.history.pushState(null, '', newUrl);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedToken) return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const isMock = typeof selectedToken._id === 'string' && selectedToken._id.startsWith('mock_');
      if (isMock) {
        alert('Booking cancelled successfully (Demo).');
        setPatientScreen('home');
        return;
      }

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateBookingStatus',
          bookingId: selectedToken._id,
          status: 'cancelled'
        })
      });
      const json = await response.json();
      if (json.success) {
        alert('Booking cancelled successfully.');
        fetchData();
        setPatientScreen('home');
      } else {
        alert('Failed to cancel booking: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error cancelling booking.');
    }
  };

  const handleLiveTrackerSubmitReview = async () => {
    if (!selectedToken) return;
    setIsRatingSubmitting(true);
    try {
      const res = await fetch('/api/clinics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addReview',
          clinicId: selectedToken.clinicId,
          review: {
            userName: selectedToken.patientName || currentUser?.name || 'Anonymous Patient',
            rating: activeRating,
            comment: activeComment.trim() || 'Consultation completed successfully!',
            doctorName: selectedToken.doctorName
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsRatingSubmitted(true);
        // Update local clinics state to reflect the new rating
        setClinics(prev => prev.map(c => c._id === json.data._id ? json.data : c));
        fetchData(); // Refresh state
      } else {
        alert('Failed to submit review: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error submitting review: ' + err.message);
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  // Filter bookings strictly for the active patient
  const userBookings = bookings.filter(b => {
    // If user is not logged in and has no session phone, do not expose any patient records or badges
    if (!currentUser && !userPhone) {
      return false;
    }

    const cleanUserPhone = (userPhone || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
    const cleanPatientPhone = (b.patientPhone || '').replace(/\D/g, '').slice(-10);

    // 1. Direct User ID match (when authenticated)
    if (b.userId && currentUser?._id && String(b.userId) === String(currentUser._id)) {
      return true;
    }

    // 2. Direct Phone Number match (10-digit normalized)
    if (cleanPatientPhone && cleanUserPhone && cleanPatientPhone === cleanUserPhone) {
      return true;
    }

    // Strict privacy: never match other patients across different phone numbers/accounts
    return false;
  });

  const formatDoctorTitle = (rawName) => {
    if (!rawName) return 'Doctor';
    const clean = rawName.trim().replace(/^dr\.?\s+/i, '');
    return clean ? `Dr. ${clean}` : 'Doctor';
  };

  const formatNotifTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    try {
      const d = new Date(timestamp);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24 && d.getDate() === now.getDate()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()) {
        return 'Yesterday';
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  // Dynamic Patient Notification & Checkup Reminders Generator
  const notifications = (() => {
    const list = [];

    userBookings.forEach(b => {
      const clinic = clinics.find(c => String(c._id) === String(b.clinicId)) || {};
      const docName = formatDoctorTitle(b.doctorName || clinic.doctorName);
      const clinicName = clinic.name || b.clinicName || 'Clinic';

      // 1. Follow-up Checkup Reminders
      if (b.followUpDate) {
        const followDate = new Date(b.followUpDate);
        const today = new Date();
        const d1 = new Date(followDate.getFullYear(), followDate.getMonth(), followDate.getDate());
        const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
        const dateFormatted = followDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        if (diffDays === 0) {
          list.push({
            id: `rem-today-${b._id}`,
            type: 'reminder',
            badgeLabel: 'Due Today',
            icon: '⏰',
            title: 'Checkup Due Today',
            message: `Your scheduled follow-up consultation with ${docName} at ${clinicName} is due today.${b.followUpNotes ? ` Note: ${b.followUpNotes}` : ''}`,
            time: formatNotifTime(b.followUpDate),
            timestamp: b.followUpDate,
            bookingId: b._id,
            read: readNotifIds.includes(`rem-today-${b._id}`),
            actionText: 'Book Checkup Now'
          });
        } else if (diffDays === 1) {
          list.push({
            id: `rem-tmrw-${b._id}`,
            type: 'reminder',
            badgeLabel: 'Tomorrow',
            icon: '⏰',
            title: 'Checkup Tomorrow',
            message: `Reminder: Follow-up checkup with ${docName} is scheduled for tomorrow (${followDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}).${b.followUpNotes ? ` Note: ${b.followUpNotes}` : ''}`,
            time: formatNotifTime(b.followUpDate),
            timestamp: b.followUpDate,
            bookingId: b._id,
            read: readNotifIds.includes(`rem-tmrw-${b._id}`),
            actionText: 'Book Checkup'
          });
        } else if (diffDays > 1) {
          list.push({
            id: `rem-soon-${b._id}`,
            type: 'reminder',
            badgeLabel: diffDays <= 7 ? `In ${diffDays} Days` : followDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            icon: '⏰',
            title: diffDays <= 7 ? `Checkup in ${diffDays} Days` : `Checkup Scheduled on ${dateFormatted}`,
            message: `Upcoming follow-up checkup with ${docName} at ${clinicName} on ${dateFormatted}.${b.followUpNotes ? ` Advice: ${b.followUpNotes}` : ''}`,
            time: formatNotifTime(b.followUpDate),
            timestamp: b.followUpDate,
            bookingId: b._id,
            read: readNotifIds.includes(`rem-soon-${b._id}`),
            actionText: 'View Details'
          });
        } else if (diffDays < 0) {
          list.push({
            id: `rem-overdue-${b._id}`,
            type: 'reminder',
            badgeLabel: 'Overdue',
            icon: '⚠️',
            title: 'Checkup Overdue',
            message: `Your scheduled follow-up with ${docName} was due on ${dateFormatted}. Please consult your doctor for review.`,
            time: formatNotifTime(b.followUpDate),
            timestamp: b.followUpDate,
            bookingId: b._id,
            read: readNotifIds.includes(`rem-overdue-${b._id}`),
            actionText: 'Book Follow-up'
          });
        }
      }

      // 2. Prescription Received Notification
      if (b.prescription || (b.medicines && b.medicines.length > 0) || b.clinicalNotes) {
        const notifId = `rx-${b._id}`;
        const medCount = b.medicines && b.medicines.length > 0 ? `${b.medicines.length} medicine${b.medicines.length > 1 ? 's' : ''}` : 'prescription advice';
        list.push({
          id: notifId,
          type: 'rx',
          badgeLabel: 'Digital Rx',
          icon: '💊',
          title: 'Digital Prescription & Diagnosis Available',
          message: `${docName} (${clinicName}) issued digital Rx for Token #${b.tokenNumber} with ${medCount}.${b.clinicalNotes ? ` Diagnosis: ${b.clinicalNotes}.` : ''}`,
          time: formatNotifTime(b.prescriptionSentAt || b.createdAt),
          timestamp: b.prescriptionSentAt || b.createdAt,
          bookingId: b._id,
          read: readNotifIds.includes(notifId),
          actionText: 'View Digital Rx'
        });
      }

      // 3. Live Token Queue Updates
      if (b.status === 'serving') {
        const notifId = `turn-${b._id}`;
        list.push({
          id: notifId,
          type: 'turn',
          badgeLabel: 'Your Turn',
          icon: '🟢',
          title: "It's Your Turn Now!",
          message: `Token #${b.tokenNumber} is currently being called by ${docName} at ${clinicName}. Please proceed to consultation.`,
          time: formatNotifTime(b.updatedAt || b.createdAt),
          timestamp: b.updatedAt || b.createdAt,
          bookingId: b._id,
          read: readNotifIds.includes(notifId),
          actionText: 'Track Live'
        });
      }
    });

    const activeList = list.filter(n => !dismissedNotifIds.includes(n.id));
    return activeList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  })();

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const activeTokenCount = userBookings.filter(b => b.status === 'waiting' || b.status === 'serving').length;
  const prescriptionCount = userBookings.filter(b => Boolean(b.prescription || (b.medicines && b.medicines.length > 0) || b.clinicalNotes)).length;

  const getUserNotifKey = () => {
    if (currentUser?._id) return String(currentUser._id);
    const cleanP = (userPhone || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
    return cleanP || 'guest';
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      const key = getUserNotifKey();
      localStorage.setItem(`tokenq_read_notifs_${key}`, JSON.stringify(allIds));
    } catch (e) {}
  };

  const handleDismissNotification = (notifId) => {
    const updated = [...dismissedNotifIds, notifId];
    setDismissedNotifIds(updated);
    try {
      const key = getUserNotifKey();
      localStorage.setItem(`tokenq_dismissed_notifs_${key}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleClearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...dismissedNotifIds, ...allIds]));
    setDismissedNotifIds(updated);
    try {
      const key = getUserNotifKey();
      localStorage.setItem(`tokenq_dismissed_notifs_${key}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleNotificationClick = (notif) => {
    if (!readNotifIds.includes(notif.id)) {
      const updated = [...readNotifIds, notif.id];
      setReadNotifIds(updated);
      try {
        const key = getUserNotifKey();
        localStorage.setItem(`tokenq_read_notifs_${key}`, JSON.stringify(updated));
      } catch (e) {}
    }
    setShowNotificationModal(false);

    if (notif.bookingId) {
      const b = bookings.find(item => item._id === notif.bookingId);
      if (b) {
        if (notif.type === 'rx' || notif.actionText?.toLowerCase().includes('prescription') || notif.actionText?.toLowerCase().includes('rx')) {
          setViewingRxBooking(b);
          return;
        }
        if (notif.type === 'reminder') {
          const clinic = clinics.find(c => String(c._id) === String(b.clinicId));
          if (clinic) {
            handleSelectClinic(clinic);
          }
          return;
        }
        if (b.status === 'waiting' || b.status === 'serving') {
          handleSelectToken(b);
          return;
        }
        if (b.prescription || (b.medicines && b.medicines.length > 0) || b.clinicalNotes) {
          setViewingRxBooking(b);
          return;
        }
      }
    }
  };

  const handleBookFollowUp = (clinic, doctorName) => {
    if (clinic) {
      setSelectedClinic(clinic);
      if (doctorName && clinic.doctors) {
        const doc = clinic.doctors.find(d => d.name === doctorName);
        if (doc) setSelectedDoctor(doc);
      }
      setPatientScreen('book');
      pushStateToHistory('book', clinic._id, doctorName);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.role === 'admin' || user.role === 'clinic-admin') {
      setViewMode('admin');
    } else {
      setViewMode('patient');
    }
    const cleanPhone = (user.phone || '').trim();
    setUserPhone(cleanPhone);
    setUserName(user.name);
    localStorage.setItem('tokenq_user', JSON.stringify(user));

    const userKey = user._id || (cleanPhone ? cleanPhone.replace(/\D/g, '').slice(-10) : 'user');
    try {
      const savedRead = localStorage.getItem(`tokenq_read_notifs_${userKey}`);
      setReadNotifIds(savedRead ? JSON.parse(savedRead) : []);
      const savedDismissed = localStorage.getItem(`tokenq_dismissed_notifs_${userKey}`);
      setDismissedNotifIds(savedDismissed ? JSON.parse(savedDismissed) : []);
    } catch (e) {
      setReadNotifIds([]);
      setDismissedNotifIds([]);
    }

    if (user.role !== 'admin' && user.role !== 'clinic-admin') {
      if (selectedClinic && selectedDoctor) {
        setPatientScreen('book');
        pushStateToHistory('book', selectedClinic._id, selectedDoctor.name);
      } else if (selectedClinic) {
        setPatientScreen('detail');
        pushStateToHistory('detail', selectedClinic._id);
      } else {
        setPatientScreen('home');
        pushStateToHistory('home');
      }
    } else {
      setPatientScreen('home');
      pushStateToHistory('home');
    }
    fetchData();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserPhone('');
    setUserName('');
    setReadNotifIds([]);
    setDismissedNotifIds([]);
    setViewingRxBooking(null);
    setSelectedToken(null);
    localStorage.removeItem('tokenq_user');
    setPatientScreen('home'); // Reset screen state
    setViewMode('patient'); // Default back to patient
    pushStateToHistory('home');
  };

  const handleCloseAuth = () => {
    if (selectedClinic) {
      setPatientScreen('detail');
      pushStateToHistory('detail', selectedClinic._id);
    } else {
      setPatientScreen('home');
      pushStateToHistory('home');
    }
  };

  const handleRequireAuth = (doctor = null) => {
    if (doctor) setSelectedDoctor(doctor);
    setPatientScreen('auth');
    pushStateToHistory('auth', selectedClinic?._id, doctor?.name);
  };

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic);
    setPatientScreen('detail');
    pushStateToHistory('detail', clinic._id);
  };

  const handleStartBooking = (doctor) => {
    setSelectedDoctor(doctor);
    setPatientScreen('book');
    pushStateToHistory('book', selectedClinic?._id, doctor.name);
  };

  const handleBookingComplete = (newBooking) => {
    // Add new booking to local list immediately and trigger data sync
    setBookings(prev => {
      const filtered = (prev || []).filter(b => String(b._id) !== String(newBooking._id));
      return [newBooking, ...filtered];
    });
    setSelectedToken(newBooking);
    setPatientScreen('token'); // Go directly to live tracking of the confirmed token
    pushStateToHistory('token', newBooking.clinicId, newBooking.doctorName, newBooking._id);
    fetchData();
  };

  const handleSelectToken = (token) => {
    setSelectedToken(token);
    setPatientScreen('token');
    pushStateToHistory('token', token.clinicId, token.doctorName, token._id);
  };

  const handleNavigate = (screen) => {
    if (screen === 'notifications') {
      setShowNotificationModal(true);
      return;
    }
    const targetScreen = screen === 'clinics' ? 'home' : screen;
    setPatientScreen(targetScreen);
    pushStateToHistory(targetScreen, selectedClinic?._id);
  };

  const handleBackToHome = () => {
    setPatientScreen('home');
    setSelectedClinic(null);
    setSelectedDoctor(null);
    setSelectedToken(null);
    pushStateToHistory('home');
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
        <div style={{ display: 'flex', width: '100%', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(5, 150, 105, 0.2)', borderTop: '3px solid var(--green)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--green-dark)', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Token<span style={{ color: 'var(--green)' }}>Q</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '8px', fontWeight: 500 }}>Smart Clinic Booking</div>
        </div>
      ) : viewMode === 'patient' ? (
        /* ===== PATIENT WORKFLOW ===== */
        <div className="patient-layout-wrap">
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
                onOpenNotifications={() => setShowNotificationModal(true)}
                unreadNotifCount={unreadNotifCount}
                activeTokenCount={activeTokenCount}
                prescriptionCount={prescriptionCount}
              />
            )}

            {/* Screen 2: Clinic Detail */}
            {patientScreen === 'detail' && selectedClinic && (
              <ClinicDetail
                clinic={selectedClinic}
                bookings={bookings}
                waitingCount={bookings.filter(b => b.clinicId === selectedClinic._id && b.status === 'waiting' && new Date(b.createdAt).toDateString() === new Date().toDateString()).length}
                onBack={handleBackToHome}
                onStartBooking={handleStartBooking}
                onRequireAuth={handleRequireAuth}
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
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', maxWidth: '650px', margin: '0 auto', height: '100%', minHeight: 'calc(100vh - 70px)' }}>
                <div className="topbar" style={{ flexShrink: 0 }}>
                  <div className="back-btn" onClick={handleBackToHome}>←</div>
                  <div className="topbar-title">Live tracker</div>
                  <div className="pill pg" style={{ fontSize: '11px' }}>🏥 Clinic</div>
                </div>
                {(() => {
                  const clinic = clinics.find(c => c._id === selectedToken.clinicId) || {};
                  const tokenDateStr = new Date(selectedToken.createdAt || Date.now()).toDateString();

                  const parseTokenNum = (tok) => {
                    const m = String(tok || '').match(/\d+/);
                    return m ? parseInt(m[0], 10) : 9999;
                  };

                  // Filter today's doctor bookings and sort strictly ascending by token number!
                  const doctorBookings = bookings
                    .filter(b =>
                      b.clinicId === selectedToken.clinicId &&
                      b.doctorName === selectedToken.doctorName &&
                      new Date(b.createdAt || Date.now()).toDateString() === tokenDateStr
                    )
                    .sort((a, b) => {
                      const numA = parseTokenNum(a.tokenNumber);
                      const numB = parseTokenNum(b.tokenNumber);
                      if (numA !== numB) return numA - numB;
                      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                    });

                  // Active queue only (serving + waiting) -> Done tokens automatically disappear so next/serving is on top!
                  const activeQueueBookings = doctorBookings.filter(b => b.status === 'serving' || b.status === 'waiting');

                  const servingBooking = doctorBookings.find(b => b.status === 'serving');
                  const nowServingToken = servingBooking ? servingBooking.tokenNumber : 'None';

                  const currentTokenNum = parseTokenNum(selectedToken.tokenNumber);
                  const activeBefore = activeQueueBookings.filter(b => {
                    if (String(b._id) === String(selectedToken._id)) return false;
                    const numB = parseTokenNum(b.tokenNumber);
                    if (numB !== currentTokenNum) return numB < currentTokenNum;
                    return new Date(b.createdAt || 0) < new Date(selectedToken.createdAt || 0);
                  });

                  const waitingAhead = selectedToken.status === 'serving'
                    ? 0
                    : activeBefore.length;
                  const selectedDocInfo = clinic.doctors?.find(d => d.name === selectedToken.doctorName);
                  const docDelay = selectedDocInfo?.delayMinutes || 0;

                  const estWaitMin = selectedToken.status === 'serving'
                    ? 0
                    : (waitingAhead * 10) + docDelay;

                  // Consultation Completed Screen
                  if (selectedToken.status === 'done') {
                    return (
                      <div className="scrollable" style={{ flex: 1, overflowY: 'auto' }}>
                        <div className="pad">
                          <div className="token-hero">
                            <div className="token-lbl">Consultation Record ({selectedToken.doctorName})</div>
                            <div className="token-num" style={{ color: 'var(--green-mid)' }}>
                              {selectedToken.tokenNumber}
                            </div>
                            <div className="token-clinic">
                              {clinic.name} · Completed
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                            <div className="alert alert-g" style={{ borderLeft: '4px solid var(--green)' }}>
                              <span style={{ fontSize: '18px' }}>✅</span>
                              <div className="alert-txt">
                                <strong>Consultation Completed!</strong>
                                Thank you for visiting. Please review your doctor's digital prescription and advice below.
                              </div>
                            </div>

                            {/* Doctor's Digital Prescription & Clinical Record Card */}
                            {(selectedToken.clinicalNotes || selectedToken.prescription) && (
                              <div style={{
                                background: 'var(--surface)',
                                borderRadius: 'var(--radius)',
                                border: '1.5px solid var(--green)',
                                padding: '16px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                marginTop: '2px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border2)', paddingBottom: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>🩺</span>
                                    <div>
                                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Doctor's Prescription & Clinical Record</div>
                                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Dr. {selectedToken.doctorName} · {clinic.name || 'Clinic'}</div>
                                    </div>
                                  </div>
                                  <span className="pill pg" style={{ fontSize: '11px' }}>Rx Verified</span>
                                </div>

                                {selectedToken.clinicalNotes && (
                                  <div style={{ background: 'var(--surface2)', padding: '10px 12px', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                      📋 Diagnosis & Clinical Notes
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                      {selectedToken.clinicalNotes}
                                    </div>
                                  </div>
                                )}

                                {selectedToken.prescription && (
                                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 12px', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green-dark)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                      💊 Prescribed Medicines & Instructions (Rx)
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontWeight: 500 }}>
                                      {selectedToken.prescription}
                                    </div>
                                  </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', fontSize: '11px', color: 'var(--text3)' }}>
                                  <span>Date: {new Date(selectedToken.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                  <button
                                    type="button"
                                    onClick={() => window.print()}
                                    style={{
                                      background: 'var(--green-light)',
                                      color: 'var(--green-dark)',
                                      border: '1px solid var(--green)',
                                      padding: '4px 10px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🖨️ Print / Save Rx
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Instant Feedback Rating Interface */}
                            {!isRatingSubmitted ? (
                              <div style={{
                                background: 'var(--surface2)',
                                borderRadius: 'var(--radius)',
                                padding: '16px',
                                border: '1.5px solid var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                                  ⭐ Rate your consultation experience
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '-6px' }}>
                                  Help others find the best care at this clinic
                                </div>

                                <div style={{ display: 'flex', gap: '6px', margin: '4px 0' }}>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                      key={star}
                                      onClick={() => setActiveRating(star)}
                                      style={{
                                        fontSize: '28px',
                                        cursor: 'pointer',
                                        opacity: star <= activeRating ? '1' : '.3',
                                        transition: 'opacity 0.15s'
                                      }}
                                    >
                                      ⭐
                                    </span>
                                  ))}
                                </div>

                                <input
                                  type="text"
                                  placeholder="Write a brief comment (optional)..."
                                  value={activeComment}
                                  onChange={(e) => setActiveComment(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border2)',
                                    background: 'var(--surface)',
                                    fontSize: '12px',
                                    fontFamily: 'inherit',
                                    outline: 'none'
                                  }}
                                />

                                <button
                                  type="button"
                                  onClick={handleLiveTrackerSubmitReview}
                                  disabled={isRatingSubmitting}
                                  style={{
                                    background: 'var(--green)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '9px 16px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    alignSelf: 'flex-start',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    opacity: isRatingSubmitting ? 0.7 : 1
                                  }}
                                >
                                  {isRatingSubmitting ? 'Submitting...' : 'Submit Feedback ✓'}
                                </button>
                              </div>
                            ) : (
                              <div style={{
                                background: 'rgba(5, 150, 105, 0.05)',
                                borderRadius: 'var(--radius)',
                                padding: '16px',
                                border: '1.5px solid var(--green)',
                                textAlign: 'center',
                                color: 'var(--green-dark)',
                                fontSize: '13px',
                                fontWeight: 600,
                                animation: 'fadeIn 0.3s ease'
                              }}>
                                ❤️ Thank you! Your rating of {activeRating} ⭐ has been shared.
                              </div>
                            )}

                            <button
                              onClick={handleBackToHome}
                              style={{
                                width: '100%',
                                padding: '13px',
                                background: 'var(--surface2)',
                                color: 'var(--text)',
                                border: '1.5px solid var(--border)',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginTop: '8px'
                              }}
                            >
                              ← Back to home
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                      {/* Top Hero Banner & Quick Stats (Fixed) */}
                      <div style={{ flexShrink: 0 }}>
                        <div className="token-hero" style={{ padding: '14px 16px', marginBottom: 0 }}>
                          <div className="token-lbl">Your Token ({selectedToken.doctorName})</div>
                          <div className="token-num" style={{ color: 'var(--green-mid)', fontSize: '32px' }}>
                            {selectedToken.tokenNumber}
                          </div>
                          <div className="token-clinic">
                            {clinic.name} · {selectedToken.slot}
                          </div>
                          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span className="pill" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.85)' }}>
                              Fee: ₹{clinic.fee || 100} (Pay at Clinic)
                            </span>
                            {(() => {
                              const mapUrl = clinic.latitude && clinic.longitude
                                ? `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`
                                : (clinic.googleMapsUrl || (clinic.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address)}` : ''));
                              if (!mapUrl) return null;
                              return (
                                <a
                                  href={mapUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="pill"
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.25)',
                                    color: '#A7F3D0',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    textDecoration: 'none',
                                    fontWeight: 600
                                  }}
                                >
                                  🧭 Map ↗
                                </a>
                              );
                            })()}
                            {clinic.contact && (
                              <a
                                href={`tel:${clinic.contact.replace(/[^0-9+]/g, '')}`}
                                className="pill"
                                style={{
                                  background: 'rgba(59, 130, 246, 0.25)',
                                  color: '#93C5FD',
                                  border: '1px solid rgba(59, 130, 246, 0.4)',
                                  textDecoration: 'none',
                                  fontWeight: 600
                                }}
                              >
                                📞 Call
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Quick Stats Bar */}
                        <div style={{ padding: '8px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                          <div className="qtracker" style={{ margin: 0, padding: '10px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11.5px', color: 'var(--text2)' }}>Now Serving: <strong style={{ color: 'var(--green-dark)' }}>{nowServingToken}</strong></span>
                              <span style={{ fontSize: '11.5px', color: 'var(--text2)' }}>Ahead: <strong>{waitingAhead}</strong></span>
                              <span style={{ fontSize: '11.5px', color: 'var(--text2)' }}>Est. Wait: <strong style={{ color: 'var(--amber)' }}>{selectedToken.status === 'serving' ? 'Serving' : estWaitMin === 0 ? 'Ready' : `~${estWaitMin}m`}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Scrollable Section: Active Queue Tokens Only (Without stranger names!) */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div className="sec-label" style={{ margin: 0, fontSize: '12px' }}>
                            Live Queue ({activeQueueBookings.length} Active in Line)
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                            Completed tokens auto-cleared
                          </span>
                        </div>

                        {activeQueueBookings.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius)', color: 'var(--text2)', fontSize: '13px' }}>
                            🎉 Queue is clear. Dr. {selectedToken.doctorName} is ready to consult!
                          </div>
                        ) : (
                          <div className="queue-timeline-wrap">
                            {activeQueueBookings.map((b, idx) => {
                              const isCurrent = String(b._id) === String(selectedToken._id) || (currentUser && b.userId && String(b.userId) === String(currentUser.id || currentUser._id));
                              const isServing = b.status === 'serving';
                              const isWaiting = b.status === 'waiting';
                              const isDone = b.status === 'done';

                              const tokenNumDigit = parseTokenNum(b.tokenNumber) !== 9999 ? parseTokenNum(b.tokenNumber) : (idx + 1);

                              let timeStr = '6:30 AM';
                              if (b.slot) {
                                const cleaned = b.slot.split('(')[0].trim();
                                const startPart = cleaned.split(/[-–]/)[0].trim();
                                const timeMatch = startPart.match(/\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/i);
                                timeStr = timeMatch ? timeMatch[0] : (startPart || '6:30 AM');
                              } else if (b.createdAt) {
                                try {
                                  timeStr = new Date(b.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                } catch {}
                              }

                              const patientDisplayName = isCurrent
                                ? `${b.patientName || currentUser?.name || 'You'} (YOU)`
                                : (b.patientName || 'Patient');

                              return (
                                <div key={b._id || idx} className="queue-row">
                                  {/* Left Circle Badge */}
                                  <div className={`queue-circle ${isDone ? 'done' : isServing ? 'active-green' : isCurrent ? 'my-token-circle' : 'waiting'}`}>
                                    {isDone ? '✓' : tokenNumDigit}
                                  </div>

                                  {/* Token Card */}
                                  <div className={`queue-card ${isServing ? 'serving-card' : isCurrent ? 'my-token-card' : isDone ? 'done-card' : ''}`}>
                                    {/* Left Column of Card */}
                                    <div className="queue-card-left">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="queue-token-num">
                                          {b.tokenNumber}
                                        </span>
                                        {isCurrent && !isServing && (
                                          <span className="my-token-badge">YOU</span>
                                        )}
                                      </div>
                                      <div className="queue-patient-name">
                                        {patientDisplayName}
                                      </div>
                                    </div>

                                    {/* Right Column of Card */}
                                    <div className="queue-card-right">
                                      {isDone ? (
                                        <span className="pill-done-tag">Done</span>
                                      ) : isServing ? (
                                        <span className="pill-inside-cabin">
                                          <span className="inside-cabin-dot"></span>
                                          INSIDE CABIN
                                        </span>
                                      ) : isCurrent ? (
                                        <span className="pill-my-waiting">Waiting (You)</span>
                                      ) : (
                                        <span className="status-waiting-txt">Waiting</span>
                                      )}
                                      <div className="queue-time-str">
                                        {timeStr}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Bottom Fixed / Sticky Controls & Status Banner */}
                      <div style={{
                        flexShrink: 0,
                        padding: '12px 16px 16px',
                        background: 'var(--surface)',
                        borderTop: '1px solid var(--border)',
                        boxShadow: '0 -4px 14px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        {/* Callout Alert Box */}
                        <div style={{
                          background: selectedToken.status === 'serving' ? '#ECFDF5' : waitingAhead === 0 ? '#FFFBEB' : '#F8FAFC',
                          border: `1.5px solid ${selectedToken.status === 'serving' ? '#10B981' : waitingAhead === 0 ? '#F59E0B' : 'var(--border)'}`,
                          borderLeft: `5px solid ${selectedToken.status === 'serving' ? '#10B981' : waitingAhead === 0 ? '#D97706' : '#3B82F6'}`,
                          borderRadius: '10px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '22px' }}>
                            {selectedToken.status === 'serving' ? '🩺' : waitingAhead === 0 ? '🏥' : waitingAhead <= 3 ? '🚶' : '🏡'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                              {selectedToken.status === 'serving'
                                ? "It is your turn now! (Inside Cabin)"
                                : waitingAhead === 0
                                ? "You are next in line!"
                                : waitingAhead === 1
                                ? "Almost your turn! (1 patient ahead)"
                                : `${waitingAhead} patients ahead (~${estWaitMin}m wait)`}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px', lineHeight: 1.3 }}>
                              {selectedToken.status === 'serving'
                                ? "Please enter the doctor's consulting room now."
                                : waitingAhead === 0
                                ? "Please stand near the doctor's cabin. You will be called in a moment."
                                : waitingAhead <= 3
                                ? "Please remain seated in the clinic waiting hall."
                                : "You can wait comfortably. We'll update you as the queue progresses."}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Cancel Booking & Back to Home */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={handleCancelBooking}
                            style={{
                              flex: 1,
                              padding: '12px',
                              background: '#DC2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.2)'
                            }}
                          >
                            Cancel Booking
                          </button>

                          <button
                            onClick={handleBackToHome}
                            style={{
                              flex: 1,
                              padding: '12px',
                              background: 'var(--surface2)',
                              color: 'var(--text)',
                              border: '1.5px solid var(--border)',
                              borderRadius: '8px',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            ← Back to home
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>
            )}

            {/* Screen 5: My Tokens List */}
            {patientScreen === 'tokens' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', maxWidth: '1050px', margin: '0 auto', padding: '0 16px' }}>
                <div className="topbar">
                  <div className="topbar-title">My tokens</div>
                </div>
                <div className="scrollable">
                  <div className="pad">
                    <div className="sec-label">Active</div>

                    {userBookings.filter(b => b.status === 'waiting' || b.status === 'serving').length > 0 ? (
                      userBookings.filter(b => b.status === 'waiting' || b.status === 'serving').map((booking, idx) => {
                        const clinic = clinics.find(c => c._id === booking.clinicId) || {};
                        return (
                          <div
                            key={booking._id ? `active-tok-${booking._id}-${idx}` : `active-tok-${idx}`}
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

                    {(() => {
                      const pastBookings = userBookings
                        .filter(b => b.status === 'done' || b.status === 'cancelled')
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                      if (pastBookings.length === 0) {
                        return (
                          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius)', color: 'var(--text2)', fontSize: '13px', marginBottom: '20px' }}>
                            No past consultation history yet.
                          </div>
                        );
                      }

                      return pastBookings.map((booking, idx) => {
                        const clinic = clinics.find(c => String(c._id) === String(booking.clinicId)) || {};
                        const dateStr = new Date(booking.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                        const isExpanded = expandedPastTokenId === booking._id;
                        const hasEMR = Boolean(booking.clinicalNotes || booking.prescription);

                        return (
                          <div
                            key={booking._id ? `past-tok-${booking._id}-${idx}` : `past-tok-${idx}`}
                            className="card"
                            style={{
                              cursor: 'default',
                              marginBottom: '12px',
                              border: hasEMR ? '1.5px solid rgba(29, 158, 117, 0.3)' : '1px solid var(--border)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                                  {clinic.name || 'Clinic'}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                                  {dateStr} · Token {booking.tokenNumber} · {formatDoctorTitle(booking.doctorName)}
                                </div>
                              </div>
                              <span className={`pill ${booking.status === 'done' ? 'pg' : 'pr'}`}>
                                {booking.status === 'done' ? 'Completed' : 'Cancelled'}
                              </span>
                            </div>

                            {/* Prescription & Clinical Entry for this past booking */}
                            {hasEMR && (
                              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border2)' }}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedPastTokenId(isExpanded ? null : booking._id)}
                                  style={{
                                    background: 'var(--green-light)',
                                    color: 'var(--green-dark)',
                                    border: '1px solid var(--green)',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%'
                                  }}
                                >
                                  <span>🩺 View Digital Prescription & Advice</span>
                                  <span>{isExpanded ? '▲' : '▼'}</span>
                                </button>

                                {isExpanded && (
                                  <div style={{
                                    background: 'var(--surface2)',
                                    borderRadius: '8px',
                                    padding: '14px',
                                    marginTop: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    fontSize: '12px',
                                    border: '1px solid var(--border2)'
                                  }}>
                                    {/* 2-COLUMN SPLIT: LEFT (Complaints & Diagnosis) | RIGHT (Prescriptions & Rx) */}
                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                      gap: '12px'
                                    }}>
                                      {/* LEFT COLUMN */}
                                      <div style={{
                                        background: 'var(--surface)',
                                        borderRadius: '6px',
                                        padding: '10px 12px',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                      }}>
                                        <div>
                                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                            🤒 Chief Complaints:
                                          </div>
                                          <div style={{ color: 'var(--text)', marginTop: '2px', fontWeight: 500 }}>
                                            {booking.complaints?.join(', ') || booking.complaintDesc || 'General consultation visit'}
                                          </div>
                                        </div>

                                        {booking.clinicalNotes && (
                                          <div style={{ borderTop: '1px dashed var(--border2)', paddingTop: '6px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                              📋 Clinical Diagnosis:
                                            </div>
                                            <div style={{ color: 'var(--text)', marginTop: '2px', fontWeight: 600 }}>
                                              {booking.clinicalNotes}
                                            </div>
                                          </div>
                                        )}

                                        {booking.followUpNotes && (
                                          <div style={{ borderTop: '1px dashed var(--border2)', paddingTop: '6px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)' }}>
                                              💡 Doctor&apos;s Advice:
                                            </div>
                                            <div style={{ color: 'var(--text2)', marginTop: '2px', fontSize: '11.5px' }}>
                                              {booking.followUpNotes}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* RIGHT COLUMN */}
                                      <div style={{
                                        background: 'var(--surface)',
                                        borderRadius: '6px',
                                        padding: '10px 12px',
                                        border: '1.5px solid rgba(16, 185, 129, 0.3)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                      }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green-dark)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                          ℞ Prescribed Medications & Rx:
                                        </div>

                                        {booking.medicines && booking.medicines.length > 0 ? (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {booking.medicines.map((m, i) => (
                                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', padding: '4px 8px', borderRadius: '4px', fontSize: '11.5px' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--text)' }}>💊 {m.name}</span>
                                                <span style={{ color: 'var(--green-dark)', fontWeight: 600 }}>{m.dosage || '1-0-1'} ({m.timing || 'After Food'})</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : booking.prescription ? (
                                          <div style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '1.4', fontWeight: 600, background: 'rgba(16, 185, 129, 0.08)', padding: '6px 8px', borderRadius: '4px' }}>
                                            💊 {booking.prescription}
                                          </div>
                                        ) : (
                                          <div style={{ color: 'var(--text3)', fontSize: '11px' }}>
                                            General consultation completed.
                                          </div>
                                        )}

                                        {booking.followUpDate && (
                                          <div style={{ marginTop: 'auto', borderTop: '1px dashed var(--border2)', paddingTop: '6px', fontSize: '11px', color: '#B45309', fontWeight: 600 }}>
                                            ⏰ Next Follow-up: {new Date(booking.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* ACTIONS */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid var(--border2)', paddingTop: '8px' }}>
                                      <button
                                        type="button"
                                        onClick={() => setViewingRxBooking(booking)}
                                        style={{
                                          background: 'var(--green-dark)',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '6px 14px',
                                          fontSize: '11.5px',
                                          fontWeight: 600,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        📄 View Full Digital Rx Slip →
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setViewingRxBooking(booking);
                                          setTimeout(() => window.print(), 300);
                                        }}
                                        style={{
                                          background: 'var(--surface)',
                                          border: '1px solid var(--border)',
                                          color: 'var(--text)',
                                          borderRadius: '6px',
                                          padding: '5px 10px',
                                          fontSize: '11.5px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        🖨️ Print Prescription
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {booking.status === 'done' && (
                              <div style={{ marginTop: '9px', paddingTop: '9px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Rate your experience</div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                      key={star}
                                      onClick={() => handleRateStar(`stars-${booking._id}`, star)}
                                      style={{ fontSize: '20px', cursor: 'pointer', opacity: star <= (ratings[`stars-${booking._id}`] || 5) ? '1' : '.3' }}
                                    >
                                      ⭐
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}

                  </div>
                </div>


              </div>
            )}

            {/* Screen 6: Dedicated Prescriptions & Medical History */}
            {patientScreen === 'prescriptions' && (
              <PatientPrescriptionsList
                bookings={userBookings}
                clinics={clinics}
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onBookClinic={handleBookFollowUp}
              />
            )}

            {/* Screen 7: Patient Profile & Health Records */}
            {patientScreen === 'profile' && (
              <PatientProfile
                currentUser={currentUser}
                userBookings={userBookings}
                clinics={clinics}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                onSelectClinic={handleSelectClinic}
                onUpdateUser={(updatedUser) => {
                  setCurrentUser(updatedUser);
                  setUserPhone(updatedUser.phone || '');
                  setUserName(updatedUser.name || '');
                }}
              />
            )}

            {/* Auth Overlay Modal */}
            {patientScreen === 'auth' && (
              <div
                className="auth-overlay-backdrop"
                onClick={handleCloseAuth}
              >
                <div
                  className="auth-modal-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AuthScreens
                    onLoginSuccess={handleLoginSuccess}
                    onClose={handleCloseAuth}
                  />
                </div>
              </div>
            )}

            {/* Bottom Navigation Bar */}
            <BottomNav
              activeScreen={patientScreen}
              onNavigate={handleNavigate}
              unreadNotifCount={unreadNotifCount}
              activeTokenCount={activeTokenCount}
              prescriptionCount={prescriptionCount}
            />

            {/* Notifications & Reminders Drawer Modal */}
            {showNotificationModal && (
              <PatientNotifications
                notifications={notifications}
                currentUser={currentUser}
                onRequireAuth={handleRequireAuth}
                onClose={() => setShowNotificationModal(false)}
                onNotificationClick={handleNotificationClick}
                onDismissNotification={handleDismissNotification}
                onClearAll={handleClearAllNotifications}
                onMarkAsRead={handleMarkAllRead}
              />
            )}

            {/* Verified Digital Prescription Modal Viewer */}
            {viewingRxBooking && (
              <PrescriptionViewer
                booking={viewingRxBooking}
                clinic={clinics.find(c => String(c._id) === String(viewingRxBooking.clinicId)) || {}}
                onClose={() => setViewingRxBooking(null)}
                onBookFollowUp={handleBookFollowUp}
              />
            )}
          </>
        </div>
      ) : (
        /* ===== ADMIN WORKFLOW ===== */
        <div className="patient-layout-wrap">
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
