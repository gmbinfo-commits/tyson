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
