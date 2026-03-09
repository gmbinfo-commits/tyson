export function createDoctor(doctors, payload) {
  const email = payload.email.trim().toLowerCase();
  if (doctors.some((d) => d.email === email)) throw new Error('Doctor exists');
  return [
    ...doctors,
    {
      id: `DOC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      name: payload.name,
      email,
      password: payload.password,
      specialties: [payload.specialty || 'General Physician'],
      languages: ['English'],
      degrees: [],
      subSpecialties: [],
      consultationModes: ['audio', 'video'],
      documents: [],
      weeklyAvailability: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] },
      payoutRate: Number(payload.payoutRate || 0),
      consultFee: Number(payload.consultFee || 0),
      onlineStatus: 'offline',
      profileCompletion: 40,
      performance: { assigned: 0, closed: 0, avgTatMins: 0, noShowRate: 0, closureRate: 0, rating: 4.5 }
    }
  ];
}

export function loginByRole(users, email, password) {
  const user = users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
  if (!user) throw new Error('Invalid credentials');
  return user;
}

export function updateDoctor(doctor, patch) {
  return { ...doctor, ...patch };
}

export function updateDoctorProfileSection(doctor, sectionPatch) {
  return { ...doctor, ...sectionPatch, profileCompletion: Math.min(100, (doctor.profileCompletion || 0) + 5) };
}

export function setDoctorAvailability(doctor, day, slots) {
  return {
    ...doctor,
    weeklyAvailability: {
      ...doctor.weeklyAvailability,
      [day]: slots
    }
  };
}
  if (!email) throw new Error('Email is required');
  if (doctors.some((d) => d.email === email)) throw new Error('Doctor already exists');

  const doctor = {
    id: `DOC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    name: payload.name.trim(),
    email,
    password: payload.password,
    specialty: payload.specialty.trim(),
    experienceYears: Number(payload.experienceYears),
    consultationFee: Number(payload.consultationFee),
    profile: {
      about: payload.about?.trim() || '',
      languages: payload.languages || [],
      qualifications: payload.qualifications?.trim() || ''
    },
    availability: [],
    performance: {
      completed: 0,
      instantPicked: 0,
      avgConsultMinutes: 0,
      rating: 4.5,
      rxTATMinutes: 12
    }
  };

  return [...doctors, doctor];
}

export function loginDoctor(doctors, email, password) {
  const doctor = doctors.find((d) => d.email === email.trim().toLowerCase());
  if (!doctor || doctor.password !== password) throw new Error('Invalid doctor credentials');
  return doctor;
}

export function loginManager(managers, email, password) {
  const manager = managers.find((m) => m.email === email.trim().toLowerCase());
  if (!manager || manager.password !== password) throw new Error('Invalid manager credentials');
  return manager;
}

export function updateDoctorProfile(doctor, profilePatch) {
  return {
    ...doctor,
    profile: {
      ...doctor.profile,
      ...profilePatch,
      languages: Array.isArray(profilePatch.languages) ? profilePatch.languages : doctor.profile.languages
    }
  };
}

export function addAvailabilitySlot(doctor, slot) {
  if (!slot.date || !slot.start || !slot.end) throw new Error('Date, start and end are required');
  if (slot.end <= slot.start) throw new Error('End time must be later than start time');

  return {
    ...doctor,
    availability: [...doctor.availability, slot]
  };
}

export function updateDoctorPerformance(doctor, patch) {
  return {
    ...doctor,
    performance: {
      ...doctor.performance,
      ...patch
    }
  };
}

export const seededManagers = [
  {
    id: 'MGR-100',
    name: 'Prasenjit Manager',
    email: 'manager@teleconsult.com',
    password: 'manager123'
  }
];

export const seededDoctors = [
  {
    id: 'DOC-DEMO1',
    name: 'Dr. Neha Rao',
    email: 'neha@teleconsult.com',
    password: 'demo123',
    specialty: 'General Physician',
    experienceYears: 8,
    consultationFee: 699,
    profile: {
      about: 'Primary care physician focused on adult medicine.',
      languages: ['English', 'Hindi'],
      qualifications: 'MBBS, DNB'
    },
    availability: [
      { date: '2026-03-10', start: '10:00', end: '13:00' },
      { date: '2026-03-11', start: '15:00', end: '18:00' }
    ],
    performance: {
      completed: 54,
      instantPicked: 17,
      avgConsultMinutes: 11,
      rating: 4.6,
      rxTATMinutes: 9
    }
  },
  {
    id: 'DOC-DEMO2',
    name: 'Dr. Dauli Priyadarshini',
    email: 'dauli@teleconsult.com',
    password: 'demo123',
    specialty: 'Pediatrics',
    experienceYears: 11,
    consultationFee: 899,
    profile: {
      about: 'Child health and preventive care specialist.',
      languages: ['English', 'Hindi', 'Bengali'],
      qualifications: 'MBBS, MD Pediatrics'
    },
    availability: [{ date: '2026-03-10', start: '09:00', end: '12:00' }],
    performance: {
      completed: 88,
      instantPicked: 35,
      avgConsultMinutes: 13,
      rating: 4.8,
      rxTATMinutes: 10
    }
  }
];
