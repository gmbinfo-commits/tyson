export const APPOINTMENT_STATUS = {
  UPCOMING: 'upcoming',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show'
};

export function groupAppointments(appointments) {
  return appointments.reduce(
    (acc, item) => {
      if (acc[item.status]) acc[item.status].push(item);
      return acc;
    },
    {
      [APPOINTMENT_STATUS.UPCOMING]: [],
      [APPOINTMENT_STATUS.IN_PROGRESS]: [],
      [APPOINTMENT_STATUS.COMPLETED]: [],
      [APPOINTMENT_STATUS.NO_SHOW]: []
    }
  );
}

export function startConsultation(appointment, startedAt = new Date().toISOString()) {
  if (appointment.status !== APPOINTMENT_STATUS.UPCOMING) {
    throw new Error('Only upcoming appointments can be started');
  }
  return { ...appointment, status: APPOINTMENT_STATUS.IN_PROGRESS, startedAt };
}

export function completeConsultation(appointment, payload) {
  if (appointment.status !== APPOINTMENT_STATUS.IN_PROGRESS) {
    throw new Error('Only in-progress appointments can be completed');
  }
  return {
    ...appointment,
    status: APPOINTMENT_STATUS.COMPLETED,
    completedAt: payload.completedAt || new Date().toISOString(),
    notes: payload.notes || '',
    diagnosis: payload.diagnosis || '',
    followUpDate: payload.followUpDate || '',
    prescription: payload.prescription || []
  };
}

export function markNoShow(appointment, actor = 'patient') {
  if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
    throw new Error('Completed appointments cannot be marked no-show');
  }
  return {
    ...appointment,
    status: APPOINTMENT_STATUS.NO_SHOW,
    noShowBy: actor,
    noShowAt: new Date().toISOString()
  };
}

export function buildManagerMetrics(appointments, doctors) {
  const counts = groupAppointments(appointments);
  return {
    doctorsOnboarded: doctors.length,
    totalAppointments: appointments.length,
    completed: counts.completed.length,
    inProgress: counts.in_progress.length,
    noShow: counts.no_show.length
  };
}

export const demoAppointments = [
  {
    id: 'TC-1001',
    patientName: 'Anita Sharma',
    age: 34,
    time: '10:00',
    symptoms: 'Fever, sore throat',
    reports: ['cbc_report.pdf'],
    status: APPOINTMENT_STATUS.UPCOMING
  },
  {
    id: 'TC-1002',
    patientName: 'Rahul Verma',
    age: 45,
    time: '10:30',
    symptoms: 'Back pain',
    reports: [],
    status: APPOINTMENT_STATUS.UPCOMING
  },
  {
    id: 'TC-0998',
    patientName: 'Megha Nair',
    age: 52,
    time: '09:15',
    symptoms: 'Headache',
    reports: ['bp_readings.jpg'],
    status: APPOINTMENT_STATUS.COMPLETED,
    diagnosis: 'Migraine',
    notes: 'Hydration and rest advised'
  }
];
