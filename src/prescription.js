export function createPrescriptionDraft(caseId, doctorId) {
  return {
    id: `RX-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    caseId,
    doctorId,
    state: 'draft',
    language: 'English',
    chiefComplaints: '',
    diagnosis: '',
    advice: '',
    investigations: '',
    followUp: '',
    medicines: [],
    createdAt: new Date().toISOString()
  };
}

export function addMedicine(rx, medicine) {
  if (!medicine.name?.trim()) throw new Error('Medicine name required');
  return {
    ...rx,
    medicines: [...rx.medicines, medicine]
  };
}

export function finalizePrescription(rx) {
  return { ...rx, state: 'final' };
}

export function prescriptionToPrintableText(rx, doctorName = 'Doctor') {
  const meds = rx.medicines
    .map((m, idx) => `${idx + 1}. ${m.name} | ${m.dose} | ${m.frequency} | ${m.duration} | ${m.remark || ''}`)
    .join('\n');
  return [
    `Prescription ID: ${rx.id}`,
    `Doctor: ${doctorName}`,
    `State: ${rx.state}`,
    `Diagnosis: ${rx.diagnosis}`,
    `Advice: ${rx.advice}`,
    'Medicines:',
    meds || 'None'
  ].join('\n');
export function addPrescriptionItem(items, medicine) {
  if (!medicine.name?.trim()) throw new Error('Medicine name is required');
  return [
    ...items,
    {
      name: medicine.name.trim(),
      dose: medicine.dose?.trim() || '',
      frequency: medicine.frequency?.trim() || '',
      duration: medicine.duration?.trim() || '',
      remark: medicine.remark?.trim() || ''
    }
  ];
}

export function formatPrescription(items) {
  return items
    .map((m, i) => `${i + 1}. ${m.name} | ${m.dose} | ${m.frequency} | ${m.duration} | ${m.remark}`)
    .join('\n');
}

export function summarizePrescription(items) {
  return {
    count: items.length,
    antibiotics: items.filter((x) => /cillin|mycin|cef/i.test(x.name)).length,
    avgDurationDays:
      items.length === 0
        ? 0
        : Math.round(
            items
              .map((x) => Number.parseInt(x.duration, 10) || 0)
              .reduce((sum, value) => sum + value, 0) / items.length
          )
  };
}
