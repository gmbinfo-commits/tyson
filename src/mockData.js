export const roles = ['doctor', 'manager', 'admin'];

export const doctors = [
  {
    id: 'DOC-101',
    name: 'Dr. Neha Rao',
    email: 'neha@teleconsult.com',
    password: 'demo123',
    gender: 'Female',
    experienceYears: 8,
    registrationNumber: 'MCI-24567',
    degrees: ['MBBS', 'DNB Family Medicine'],
    specialties: ['General Physician', 'Tele Consultation'],
    subSpecialties: ['Preventive Care'],
    languages: ['English', 'Hindi'],
    consultationModes: ['audio', 'video'],
    bio: 'Primary care physician focused on acute and preventive consultation.',
    documents: [
      { id: 'D1', name: 'Medical Council Certificate.pdf', url: 'data:text/plain,Certificate%20Placeholder' },
      { id: 'D2', name: 'Signature.png', url: 'data:text/plain,Signature%20Placeholder' }
    ],
    photoUrl: 'https://placehold.co/100x100',
    signatureUrl: 'https://placehold.co/220x80?text=Signature',
    payoutRate: 420,
    consultFee: 700,
    onlineStatus: 'online',
    profileCompletion: 92,
    performance: { assigned: 22, closed: 18, avgTatMins: 11, noShowRate: 4, closureRate: 82, rating: 4.7 },
    availabilityTemplates: ['Mon-Fri Morning'],
    weeklyAvailability: {
      Mon: ['09:00', '09:30', '10:00', '10:30', '11:00'],
      Tue: ['09:00', '09:30', '10:00', '10:30', '11:00'],
      Wed: ['15:00', '15:30', '16:00'],
      Thu: ['09:00', '09:30'],
      Fri: ['12:00', '12:30', '13:00'],
      Sat: [],
      Sun: []
    }
  },
  {
    id: 'DOC-202',
    name: 'Dr. Dauli Priyadarshini',
    email: 'dauli@teleconsult.com',
    password: 'demo123',
    gender: 'Female',
    experienceYears: 11,
    registrationNumber: 'MCI-63244',
    degrees: ['MBBS', 'MD Pediatrics'],
    specialties: ['Pediatrics'],
    subSpecialties: ['ENT Infections'],
    languages: ['English', 'Hindi', 'Bengali'],
    consultationModes: ['audio', 'video'],
    bio: 'Pediatric specialist for fever, ENT, and growth monitoring.',
    documents: [{ id: 'D3', name: 'Pediatric Fellowship.pdf', url: 'data:text/plain,Fellowship' }],
    photoUrl: 'https://placehold.co/100x100',
    signatureUrl: 'https://placehold.co/220x80?text=Dr+Dauli',
    payoutRate: 510,
    consultFee: 900,
    onlineStatus: 'busy',
    profileCompletion: 96,
    performance: { assigned: 30, closed: 27, avgTatMins: 13, noShowRate: 3, closureRate: 90, rating: 4.8 },
    availabilityTemplates: ['Mon-Sat'],
    weeklyAvailability: {
      Mon: ['10:00', '10:30', '11:00'],
      Tue: ['10:00', '10:30'],
      Wed: ['10:00', '10:30', '11:00', '11:30'],
      Thu: ['14:00', '14:30'],
      Fri: ['10:00', '10:30'],
      Sat: ['09:00', '09:30'],
      Sun: []
    }
  }
];

export const managers = [{ id: 'MGR-1', name: 'Ops Manager', email: 'manager@teleconsult.com', password: 'manager123' }];
export const admins = [{ id: 'ADM-1', name: 'Platform Admin', email: 'admin@teleconsult.com', password: 'admin123' }];

export const patients = [
  {
    id: 'PAT-1',
    name: 'Yash Sharma',
    age: 24,
    gender: 'Male',
    chronicFlags: ['Recurrent URTI'],
    medicationHistory: ['Azithromycin (Nov 2025)'],
    previousDiagnoses: ['Viral URTI'],
    recentVitals: { bp: '122/80', pulse: 84, spo2: 98 },
    account: 'Care Health Insurance'
  },
  {
    id: 'PAT-2',
    name: 'Avni',
    age: 2,
    gender: 'Female',
    chronicFlags: ['Pediatric ENT risk'],
    medicationHistory: ['Syp CypON'],
    previousDiagnoses: ['Otitis Media'],
    recentVitals: { temp: '99.4F', pulse: 106, spo2: 98 },
    account: 'HDFC Ergo'
  }
];

export const cases = [
  {
    id: 'CASE-1001',
    patientId: 'PAT-1',
    issue: 'Cough and fever',
    priority: 'high',
    queueType: 'scheduled',
    status: 'waiting',
    assignedDoctorId: 'DOC-101',
    language: 'Hindi',
    specialty: 'General Physician',
    createdAt: '2026-03-09T09:30:00Z',
    waitingMins: 27,
    slaRisk: 'medium',
    analyticsAvailable: true,
    previousConsults: 4,
    attachments: [
      { id: 'A1', name: 'CBC_Report.pdf', uploadedAt: '2026-03-09 09:10', source: 'patient', url: 'data:text/plain,CBC REPORT' },
      { id: 'A2', name: 'Prescription_Old.pdf', uploadedAt: '2026-03-09 09:12', source: 'patient', url: 'data:text/plain,OLD RX' }
    ],
    notes: 'Patient reports sore throat since 2 days.',
    timeline: [
      { time: '09:30', event: 'Case created' },
      { time: '09:35', event: 'Assigned to Dr. Neha Rao' }
    ],
    assignmentHistory: [{ time: '09:35', actor: 'manager', action: 'Assigned', doctorId: 'DOC-101' }],
    consultHistory: [{ date: '2026-02-10', summary: 'URTI consult, meds advised' }],
    chat: [{ sender: 'patient', text: 'Uploaded CBC report.', at: '09:32' }],
    prescriptionIds: ['RX-4001'],
    opsHistory: [{ time: '09:35', status: 'Assigned', remarks: 'SLA watch' }],
    customerInsights: 'Policy has recurring respiratory consult pattern.'
  },
  {
    id: 'CASE-1002',
    patientId: 'PAT-2',
    issue: 'Ear pain',
    priority: 'critical',
    queueType: 'instant',
    status: 'assigned',
    assignedDoctorId: 'DOC-202',
    language: 'English',
    specialty: 'Pediatrics',
    createdAt: '2026-03-09T10:05:00Z',
    waitingMins: 9,
    slaRisk: 'low',
    analyticsAvailable: true,
    previousConsults: 2,
    attachments: [{ id: 'A3', name: 'Ear_Image.jpg', uploadedAt: '2026-03-09 10:04', source: 'patient', url: 'data:text/plain,EAR IMAGE' }],
    notes: 'Child irritable, crying at night.',
    timeline: [
      { time: '10:05', event: 'Instant case requested' },
      { time: '10:06', event: 'Assigned to Dr. Dauli' }
    ],
    assignmentHistory: [{ time: '10:06', actor: 'manager', action: 'Assigned', doctorId: 'DOC-202' }],
    consultHistory: [{ date: '2026-01-08', summary: 'Otitis follow-up completed' }],
    chat: [{ sender: 'patient', text: 'Please call quickly.', at: '10:05' }],
    prescriptionIds: ['RX-4002'],
    opsHistory: [{ time: '10:06', status: 'Assigned', remarks: 'Instant SLA met' }],
    customerInsights: 'High pediatric touchpoint account.'
  }
];

export const appointments = [
  {
    id: 'APT-9001',
    caseId: 'CASE-1001',
    patientId: 'PAT-1',
    doctorId: 'DOC-101',
    consultDate: '2026-03-09',
    status: 'in_progress',
    consultMode: 'audio',
    consultFeeSnapshot: 700,
    payoutSnapshot: 420,
    pricingRuleSnapshot: 'GEN_PHY_STANDARD_V1',
    settlementStatus: 'unsettled',
    adjustment: 0,
    finalPayable: 420
  },
  {
    id: 'APT-9002',
    caseId: 'CASE-1002',
    patientId: 'PAT-2',
    doctorId: 'DOC-202',
    consultDate: '2026-03-09',
    status: 'completed',
    consultMode: 'video',
    consultFeeSnapshot: 900,
    payoutSnapshot: 510,
    pricingRuleSnapshot: 'PEDIATRIC_STANDARD_V2',
    settlementStatus: 'settled',
    adjustment: 40,
    finalPayable: 550
  }
];

export const prescriptions = [
  {
    id: 'RX-4001',
    caseId: 'CASE-1001',
    doctorId: 'DOC-101',
    state: 'draft',
    language: 'English',
    chiefComplaints: 'Fever, cough, sore throat',
    diagnosis: 'Probable URTI',
    advice: 'Hydration, steam inhalation, rest',
    investigations: 'CBC, CRP if fever persists',
    followUp: '2026-03-12',
    medicines: [{ name: 'Paracetamol 650', dose: '1', frequency: '1-0-1', duration: '3', remark: 'After food' }],
    createdAt: '2026-03-09 10:20'
  },
  {
    id: 'RX-4002',
    caseId: 'CASE-1002',
    doctorId: 'DOC-202',
    state: 'final',
    language: 'English',
    chiefComplaints: 'Ear pain with low-grade fever',
    diagnosis: 'Acute otitis media',
    advice: 'Do not insert objects in ear',
    investigations: 'None',
    followUp: '2026-03-11',
    medicines: [{ name: 'Syp Amoxicillin', dose: '5ml', frequency: '1-0-1', duration: '3', remark: 'After meals' }],
    createdAt: '2026-03-09 10:35'
  }
];

export const analytics = {
  doctorDashboard: { todayConsults: 9, pendingQueue: 3, completedToday: 7, earningsToday: 2940, nextSlot: '11:30 AM' },
  managerDashboard: {
    doctorsOnline: 8,
    doctorsBusy: 4,
    doctorsOffline: 5,
    waitingCases: 12,
    unassignedCases: 5,
    inProgress: 7,
    avgWaitMins: 14,
    slaRiskCases: 3,
    assignedVsClosed: '68/54',
    closureRate: 79
  },
  adminDashboard: { activeDoctors: 17, profileCompletionRisk: 4, payoutAlerts: 2, pendingTasks: 6 }
};
