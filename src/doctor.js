export function createDoctor(doctors, payload) {
  const email = payload.email.trim().toLowerCase();
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
      about: '',
      languages: [],
      qualifications: ''
    },
    availability: []
  };

  return [...doctors, doctor];
}

export function loginDoctor(doctors, email, password) {
  const doctor = doctors.find((d) => d.email === email.trim().toLowerCase());
  if (!doctor || doctor.password !== password) {
    throw new Error('Invalid credentials');
  }
  return doctor;
}

export function updateDoctorProfile(doctor, profilePatch) {
  return {
    ...doctor,
    profile: {
      ...doctor.profile,
      ...profilePatch,
      languages: Array.isArray(profilePatch.languages)
        ? profilePatch.languages
        : doctor.profile.languages
    }
  };
}

export function addAvailabilitySlot(doctor, slot) {
  if (!slot.date || !slot.start || !slot.end) {
    throw new Error('Date, start and end are required');
  }
  if (slot.end <= slot.start) {
    throw new Error('End time must be later than start time');
  }

  return {
    ...doctor,
    availability: [...doctor.availability, slot]
  };
}

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
    availability: [{ date: '2026-03-10', start: '10:00', end: '13:00' }]
  }
];
