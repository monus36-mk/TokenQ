// Fallback mock data when MongoDB is not running
let clinics = [
  {
    _id: '60c72b2f9b1d8b22a0c4f101',
    name: 'Dr. Ramesh General Clinic',
    doctorName: 'Dr. Ramesh Kumar',
    specialty: 'General',
    address: 'Anna Nagar, Thanjavur',
    fee: 100,
    timings: '6:00 AM – 9:30 AM',
    contact: '+91 94430 XXXXX',
    rating: 4.8,
    ratingCount: 142,
    totalTokens: 40,
    bookedCount: 18,
    avgWaitTime: '~45 min',
    icon: '🏥',
    isPaused: false,
    delayMinutes: 0,
    isUnavailable: false
  },
  {
    _id: '60c72b2f9b1d8b22a0c4f102',
    name: 'Smile Dental Care',
    doctorName: 'Dr. Sarah Abraham',
    specialty: 'Dental',
    address: 'New Town, Thanjavur',
    fee: 150,
    timings: '9:00 AM – 1:00 PM',
    contact: '+91 98430 XXXXX',
    rating: 4.5,
    ratingCount: 65,
    totalTokens: 20,
    bookedCount: 5,
    avgWaitTime: '~15 min',
    icon: '🦷',
    isPaused: false,
    delayMinutes: 0,
    isUnavailable: false
  },
  {
    _id: '60c72b2f9b1d8b22a0c4f103',
    name: 'Sakthi Paediatric Clinic',
    doctorName: 'Dr. Sakthi Vel',
    specialty: 'Paediatric',
    address: 'Medical College Road, Thanjavur',
    fee: 120,
    timings: '4:00 PM – 8:00 PM',
    contact: '+91 95430 XXXXX',
    rating: 4.7,
    ratingCount: 118,
    totalTokens: 40,
    bookedCount: 36,
    avgWaitTime: '~2 hr',
    icon: '👶',
    isPaused: false,
    delayMinutes: 0,
    isUnavailable: false
  }
];

let bookings = [
  {
    _id: 'booking_1',
    tokenNumber: 'A-12',
    clinicId: '60c72b2f9b1d8b22a0c4f101',
    patientName: 'Kavitha Rajan',
    patientAge: 34,
    patientGender: 'F',
    patientPhone: '+91 98765 43210',
    visitType: 'new',
    medication: 'no',
    complaints: ['Fever', 'Cold / Cough'],
    describeComplaint: 'Fever for 2 days, not eating well',
    severity: 'Mild — manageable',
    slot: '7:00 AM',
    status: 'serving',
    createdAt: new Date(Date.now() - 10000000),
    feePaid: 105
  },
  {
    _id: 'booking_2',
    tokenNumber: 'A-13',
    clinicId: '60c72b2f9b1d8b22a0c4f101',
    patientName: 'Murugan K.',
    patientAge: 45,
    patientGender: 'M',
    patientPhone: '+91 98456 12301',
    visitType: 'returning',
    medication: 'no',
    complaints: ['Body pain'],
    describeComplaint: 'Muscle ache and joint stiffness',
    severity: 'Mild — manageable',
    slot: '7:00 AM',
    status: 'waiting',
    createdAt: new Date(Date.now() - 9000000),
    feePaid: 105
  },
  {
    _id: 'booking_3',
    tokenNumber: 'A-14',
    clinicId: '60c72b2f9b1d8b22a0c4f101',
    patientName: 'Selvi Devi',
    patientAge: 29,
    patientGender: 'F',
    patientPhone: '+91 91234 56789',
    visitType: 'new',
    medication: 'no',
    complaints: ['Headache'],
    describeComplaint: 'Throbbing migraine since morning',
    severity: 'Mild — manageable',
    slot: '7:30 AM',
    status: 'waiting',
    createdAt: new Date(Date.now() - 8000000),
    feePaid: 105
  },
  {
    _id: 'booking_4',
    tokenNumber: 'A-15',
    clinicId: '60c72b2f9b1d8b22a0c4f101',
    patientName: 'Ravi Kumar',
    patientAge: 52,
    patientGender: 'M',
    patientPhone: '+91 97865 43210',
    visitType: 'new',
    medication: 'yes',
    complaints: ['Chest pain'],
    describeComplaint: 'Slight heaviness in chest after meals',
    severity: 'Moderate — affecting daily routine',
    slot: '7:30 AM',
    status: 'waiting',
    createdAt: new Date(Date.now() - 7000000),
    feePaid: 105
  },
  {
    _id: 'booking_5',
    tokenNumber: 'A-16',
    clinicId: '60c72b2f9b1d8b22a0c4f101',
    patientName: 'Padma S.',
    patientAge: 61,
    patientGender: 'F',
    patientPhone: '+91 93456 78901',
    visitType: 'returning',
    medication: 'no',
    complaints: ['Fever'],
    describeComplaint: 'Chills and body temperature around 100F',
    severity: 'Mild — manageable',
    slot: '8:00 AM',
    status: 'waiting',
    createdAt: new Date(Date.now() - 6000000),
    feePaid: 105
  },
  {
    _id: 'booking_6',
    tokenNumber: 'A-17',
    clinicId: '60c72b2f9b1d8b22a0c4f101',
    patientName: 'Anand Raj',
    patientAge: 38,
    patientGender: 'M',
    patientPhone: '+91 94567 89012',
    visitType: 'returning',
    medication: 'no',
    complaints: ['Follow-up'],
    describeComplaint: 'Regular monthly BP follow up',
    severity: 'Mild — manageable',
    slot: '8:00 AM',
    status: 'waiting',
    createdAt: new Date(Date.now() - 5000000),
    feePaid: 105
  },
  {
    _id: 'booking_7',
    tokenNumber: 'A-18',
    clinicId: '60c72b2f9b1d8b22a0c4f101',
    patientName: 'Dhanalakshmi',
    patientAge: 65,
    patientGender: 'F',
    patientPhone: '+91 95678 90123',
    visitType: 'new',
    medication: 'yes',
    complaints: ['Routine checkup'],
    describeComplaint: 'Geriatric health screening',
    severity: 'Mild — manageable',
    slot: '8:30 AM',
    status: 'waiting',
    createdAt: new Date(Date.now() - 4000000),
    feePaid: 105
  }
];

export function getMockClinics() {
  return clinics;
}

export function getMockClinicsById(id) {
  return clinics.find(c => c._id === id);
}

export function updateMockClinic(id, update) {
  clinics = clinics.map(c => c._id === id ? { ...c, ...update } : c);
  return clinics.find(c => c._id === id);
}

export function getMockBookings(phone = null) {
  if (phone) {
    return bookings.filter(b => b.patientPhone === phone);
  }
  return bookings;
}

export function getMockBookingsByClinic(clinicId) {
  return bookings.filter(b => b.clinicId === clinicId);
}

export function createMockBooking(bookingData) {
  const newBooking = {
    _id: 'booking_' + (bookings.length + 1),
    createdAt: new Date(),
    ...bookingData
  };
  bookings.push(newBooking);
  
  // Update clinic count
  const clinic = clinics.find(c => c._id === bookingData.clinicId);
  if (clinic) {
    clinic.bookedCount = (clinic.bookedCount || 0) + 1;
  }
  
  return newBooking;
}

export function updateMockBookingStatus(id, status) {
  bookings = bookings.map(b => b._id === id ? { ...b, status } : b);
  return bookings.find(b => b._id === id);
}

export function updateMockBookingNotes(id, prescription, clinicalNotes) {
  bookings = bookings.map(b => b._id === id ? { ...b, prescription: prescription || '', clinicalNotes: clinicalNotes || '' } : b);
  return bookings.find(b => b._id === id);
}

export function addMockClinicalEntry({ clinicId, patientName, patientPhone, patientAge, patientGender, doctorName, clinicalNotes, prescription, bookingId, isNewRecord }) {
  if (bookingId && !isNewRecord) {
    return updateMockBookingNotes(bookingId, prescription, clinicalNotes);
  }
  const newB = {
    _id: 'booking_' + (bookings.length + 1),
    tokenNumber: 'E-' + Math.floor(100 + Math.random() * 900),
    clinicId,
    patientName,
    patientPhone,
    patientAge: Number(patientAge) || 25,
    patientGender: patientGender || 'M',
    doctorName: doctorName || 'Doctor',
    status: 'done',
    visitType: 'returning',
    clinicalNotes: clinicalNotes || '',
    prescription: prescription || '',
    createdAt: new Date()
  };
  bookings.unshift(newB);
  return newB;
}

export function deleteMockClinicalEntry(id) {
  bookings = bookings.filter(item => String(item._id) !== String(id));
  return true;
}
