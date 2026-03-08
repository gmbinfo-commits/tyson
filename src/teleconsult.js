export const APPOINTMENT_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
  CANCELLED: 'cancelled'
};

export const CONSULT_MODE = {
  AUDIO: 'audio',
  VIDEO: 'video'
};

export function groupAppointments(appointments) {
  const base = {
    requested: [],
    accepted: [],
    in_progress: [],
    completed: [],
    no_show: [],
    cancelled: []
  };

  return appointments.reduce((acc, item) => {
    if (acc[item.status]) acc[item.status].push(item);
    return acc;
  }, base);
}

export function startConsultation(appointment, mode, startedAt = new Date().toISOString()) {
  if (![APPOINTMENT_STATUS.REQUESTED, APPOINTMENT_STATUS.ACCEPTED].includes(appointment.status)) {
    throw new Error('Only requested or accepted appointments can be started');
  }
  if (!Object.values(CONSULT_MODE).includes(mode)) throw new Error('Consultation mode is required');

  return {
    ...appointment,
    status: APPOINTMENT_STATUS.IN_PROGRESS,
    consultMode: mode,
    startedAt
  };
}

export function assignDoctor(appointment, doctorId) {
  return {
    ...appointment,
    assignedDoctorId: doctorId,
    status: APPOINTMENT_STATUS.ACCEPTED
  };
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
  if ([APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED].includes(appointment.status)) {
    throw new Error('Finalized appointments cannot be marked no-show');
  }

  return {
    ...appointment,
    status: APPOINTMENT_STATUS.NO_SHOW,
    noShowBy: actor,
    noShowAt: new Date().toISOString()
  };
}

export function calculateDoctorDashboard(appointments, doctorId) {
  const own = appointments.filter((a) => a.assignedDoctorId === doctorId);
  const completed = own.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED);
  const instant = own.filter((a) => a.queueType === 'instant');
  return {
    assigned: own.length,
    completed: completed.length,
    instant: instant.length,
    completionRate: own.length ? Math.round((completed.length / own.length) * 100) : 0
  };
}

export function buildManagerMetrics(appointments, doctors) {
  const counts = groupAppointments(appointments);
  const instant = appointments.filter((a) => a.queueType === 'instant');
  return {
    doctorsListed: doctors.length,
    requested: counts.requested.length,
    inProgress: counts.in_progress.length,
    completed: counts.completed.length,
    instantQueue: instant.length
  };
}

export function addChatMessage(appointment, message) {
  return {
    ...appointment,
    chat: [...(appointment.chat || []), message]
  };
}

export const prescriptionInsights = {
  trendingConditions: ['URTI', 'Viral Fever', 'Migraine'],
  adherenceScore: 82,
  highRiskFlagRate: 14,
  topAdvice: 'Hydration + follow-up in 3 days improves recovery outcomes by 21% in similar cases.'
};

export const demoAppointments = [
  {
    id: 'TC-1001',
    patientName: 'Yash Sharma',
    age: 24,
    time: '10:00',
    symptoms: 'Cough, mild fever',
    reports: ['cbc_report.pdf'],
    queueType: 'scheduled',
    assignedDoctorId: 'DOC-DEMO1',
    status: APPOINTMENT_STATUS.REQUESTED,
    chat: [{ sender: 'patient', text: 'Uploaded CBC report, please check.', at: '10:01' }]
  },
  {
    id: 'TC-1002',
    patientName: 'Priya Singh',
    age: 31,
    time: '10:20',
    symptoms: 'Migraine, nausea',
    reports: [],
    queueType: 'scheduled',
    assignedDoctorId: 'DOC-DEMO2',
    status: APPOINTMENT_STATUS.ACCEPTED,
    chat: []
  },
  {
    id: 'TC-1003',
    patientName: 'Kiyansh Arora',
    age: 2,
    time: '10:35',
    symptoms: 'Ear pain',
    reports: ['ear_photo.jpg'],
    queueType: 'instant',
    assignedDoctorId: null,
    status: APPOINTMENT_STATUS.REQUESTED,
    chat: [{ sender: 'patient', text: 'Child has pain since morning', at: '10:36' }]
  },
  {
    id: 'TC-0999',
    patientName: 'Avni',
    age: 2,
    time: '09:40',
    symptoms: 'Cold and cough',
    reports: ['rx_history.pdf'],
    queueType: 'instant',
    assignedDoctorId: 'DOC-DEMO2',
    status: APPOINTMENT_STATUS.COMPLETED,
    diagnosis: 'Acute Otitis Media',
    notes: 'Monitor fever and hydration',
    prescription: [{ name: 'Syp Amoxicillin', dose: '5ml', frequency: '1-0-1', duration: '3 days' }],
    chat: []
  }
];
