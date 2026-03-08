export function addPrescriptionItem(items, medicine) {
  if (!medicine.name?.trim()) throw new Error('Medicine name is required');
  return [
    ...items,
    {
      name: medicine.name.trim(),
      dose: medicine.dose?.trim() || '',
      frequency: medicine.frequency?.trim() || '',
      duration: medicine.duration?.trim() || ''
    }
  ];
}

export function formatPrescription(items) {
  return items
    .map((m, i) => `${i + 1}. ${m.name} | ${m.dose} | ${m.frequency} | ${m.duration}`)
    .join('\n');
}
