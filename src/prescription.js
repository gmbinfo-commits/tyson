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
