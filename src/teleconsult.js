export function queueBuckets(cases, roleDoctorId = null) {
  const filtered = roleDoctorId ? cases.filter((c) => !c.assignedDoctorId || c.assignedDoctorId === roleDoctorId) : cases;
  return {
    waiting: filtered.filter((c) => c.status === 'waiting'),
    assigned: filtered.filter((c) => c.status === 'assigned'),
    in_consultation: filtered.filter((c) => c.status === 'in_consultation'),
    follow_up_due: filtered.filter((c) => c.status === 'follow_up_due'),
    completed_today: filtered.filter((c) => c.status === 'completed_today')
  };
}

export function assignCaseToDoctor(caseItem, doctorId, actor = 'manager') {
  return {
    ...caseItem,
    assignedDoctorId: doctorId,
    status: 'assigned',
    assignmentHistory: [
      ...(caseItem.assignmentHistory || []),
      { time: new Date().toISOString(), actor, action: 'Assigned', doctorId }
    ]
  };
}

export function startCaseConsult(caseItem, mode) {
  if (!['audio', 'video'].includes(mode)) throw new Error('Invalid consult mode');
  return {
    ...caseItem,
    status: 'in_consultation',
    consultMode: mode,
    timeline: [...(caseItem.timeline || []), { time: new Date().toISOString(), event: `Consult started (${mode})` }]
  };
}

export function closeCase(caseItem) {
  return {
    ...caseItem,
    status: 'completed_today',
    timeline: [...(caseItem.timeline || []), { time: new Date().toISOString(), event: 'Case closed' }]
  };
}

export function addCaseNote(caseItem, note) {
  return {
    ...caseItem,
    notes: `${caseItem.notes || ''}\n${note}`.trim(),
    timeline: [...(caseItem.timeline || []), { time: new Date().toISOString(), event: 'Note added' }]
  };
}

export function addChatMessage(caseItem, message) {
  return {
    ...caseItem,
    chat: [...(caseItem.chat || []), message]
  };
}

export function managerInsights(cases, doctors) {
  const online = doctors.filter((d) => d.onlineStatus === 'online').length;
  const busy = doctors.filter((d) => d.onlineStatus === 'busy').length;
  const waiting = cases.filter((c) => c.status === 'waiting').length;
  const unassigned = cases.filter((c) => !c.assignedDoctorId).length;
  const inProgress = cases.filter((c) => c.status === 'in_consultation').length;
  const closed = cases.filter((c) => c.status === 'completed_today').length;
  return { online, busy, waiting, unassigned, inProgress, closed };
}

export function doctorInsights(cases, doctorId) {
  const mine = cases.filter((c) => c.assignedDoctorId === doctorId);
  const closed = mine.filter((c) => c.status === 'completed_today').length;
  return {
    total: mine.length,
    closed,
    closureRate: mine.length ? Math.round((closed / mine.length) * 100) : 0
  };
}
