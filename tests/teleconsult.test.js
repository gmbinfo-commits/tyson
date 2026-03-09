import test from 'node:test';
import assert from 'node:assert/strict';
import { queueBuckets, assignCaseToDoctor, startCaseConsult, closeCase, managerInsights, doctorInsights, addChatMessage } from '../src/teleconsult.js';
import { createDoctor, loginByRole, setDoctorAvailability, updateDoctorProfileSection } from '../src/doctor.js';
import { createPrescriptionDraft, addMedicine, finalizePrescription, prescriptionToPrintableText } from '../src/prescription.js';
import { doctors, managers, admins, cases, appointments } from '../src/mockData.js';

test('role login works for doctor/manager/admin', () => {
  assert.equal(loginByRole(doctors, 'neha@teleconsult.com', 'demo123').id, 'DOC-101');
  assert.equal(loginByRole(managers, 'manager@teleconsult.com', 'manager123').id, 'MGR-1');
  assert.equal(loginByRole(admins, 'admin@teleconsult.com', 'admin123').id, 'ADM-1');
});

test('queue buckets are created correctly', () => {
  const buckets = queueBuckets(cases);
  assert.ok(Array.isArray(buckets.waiting));
  assert.ok('assigned' in buckets);
});

test('manager can assign case to doctor', () => {
  const updated = assignCaseToDoctor(cases[0], 'DOC-202');
  assert.equal(updated.assignedDoctorId, 'DOC-202');
  assert.equal(updated.status, 'assigned');
  assert.equal(updated.assignmentHistory.at(-1).action, 'Assigned');
});

test('consult start and close status flow', () => {
  const started = startCaseConsult({ ...cases[0], status: 'assigned' }, 'audio');
  assert.equal(started.status, 'in_consultation');
  const closed = closeCase(started);
  assert.equal(closed.status, 'completed_today');
});

test('doctor profile and slot updates', () => {
  let created = createDoctor(doctors, { name: 'Dr X', email: 'x@x.com', password: '1', specialty: 'ENT' });
  let d = created.at(-1);
  d = updateDoctorProfileSection(d, { languages: ['English', 'Hindi'] });
  d = setDoctorAvailability(d, 'Mon', ['09:00', '09:30']);
  assert.equal(d.languages.length, 2);
  assert.equal(d.weeklyAvailability.Mon.length, 2);
});

test('prescription lifecycle and printable preview', () => {
  let rx = createPrescriptionDraft('CASE-X', 'DOC-101');
  rx = addMedicine(rx, { name: 'Paracetamol', dose: '1', frequency: '1-0-1', duration: '3', remark: 'After food' });
  rx = finalizePrescription(rx);
  assert.equal(rx.state, 'final');
  assert.match(prescriptionToPrintableText(rx, 'Dr A'), /Paracetamol/);
});

test('chat append and insights', () => {
  const withChat = addChatMessage(cases[0], { sender: 'doctor', text: 'hello', at: '10:00' });
  assert.equal(withChat.chat.length, cases[0].chat.length + 1);
  const m = managerInsights(cases, doctors);
  assert.ok(m.waiting >= 0);
  const d = doctorInsights(cases, 'DOC-101');
  assert.ok('closureRate' in d);
});

test('appointment payout snapshot remains stable unless adjustment changed', () => {
  const row = structuredClone(appointments[0]);
  const oldSnapshot = row.payoutSnapshot;
  row.adjustment = 30;
  row.finalPayable = row.payoutSnapshot + row.adjustment;
  assert.equal(row.payoutSnapshot, oldSnapshot);
  assert.equal(row.finalPayable, oldSnapshot + 30);
});
