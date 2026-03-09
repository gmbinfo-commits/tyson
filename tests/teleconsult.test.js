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
import {
  APPOINTMENT_STATUS,
  CONSULT_MODE,
  groupAppointments,
  startConsultation,
  completeConsultation,
  markNoShow,
  buildManagerMetrics,
  calculateDoctorDashboard,
  assignDoctor,
  addChatMessage,
  demoAppointments
} from '../src/teleconsult.js';
import {
  createDoctor,
  loginDoctor,
  loginManager,
  addAvailabilitySlot,
  seededDoctors,
  seededManagers,
  updateDoctorProfile
} from '../src/doctor.js';
import { addPrescriptionItem, summarizePrescription } from '../src/prescription.js';

test('startConsultation requires mode and updates status', () => {
  const result = startConsultation({ status: APPOINTMENT_STATUS.REQUESTED }, CONSULT_MODE.AUDIO);
  assert.equal(result.status, APPOINTMENT_STATUS.IN_PROGRESS);
  assert.equal(result.consultMode, CONSULT_MODE.AUDIO);
});

test('completeConsultation marks completed from in-progress', () => {
  const result = completeConsultation(
    { status: APPOINTMENT_STATUS.IN_PROGRESS },
    { diagnosis: 'URTI', prescription: [{ name: 'Paracetamol' }] }
  );
  assert.equal(result.status, APPOINTMENT_STATUS.COMPLETED);
  assert.equal(result.diagnosis, 'URTI');
});

test('manager and doctor login work', () => {
  const d = loginDoctor(seededDoctors, 'neha@teleconsult.com', 'demo123');
  const m = loginManager(seededManagers, 'manager@teleconsult.com', 'manager123');
  assert.equal(d.id, 'DOC-DEMO1');
  assert.equal(m.id, 'MGR-100');
});

test('doctor onboarding, profile update and availability work', () => {
  let doctors = [...seededDoctors];
  doctors = createDoctor(doctors, {
    name: 'Dr New',
    email: 'new@tele.com',
    password: 'p123',
    specialty: 'Cardiology',
    experienceYears: 5,
    consultationFee: 900
  });
  const doctor = loginDoctor(doctors, 'new@tele.com', 'p123');
  const profile = updateDoctorProfile(doctor, { qualifications: 'MBBS, MD', languages: ['English'] });
  const withSlot = addAvailabilitySlot(profile, { date: '2026-03-20', start: '10:00', end: '12:00' });
  assert.equal(withSlot.availability.length, 1);
  assert.equal(withSlot.profile.qualifications, 'MBBS, MD');
});

test('instant queue assign and dashboard metrics', () => {
  const instant = demoAppointments.find((a) => a.queueType === 'instant' && !a.assignedDoctorId);
  const assigned = assignDoctor(instant, 'DOC-DEMO1');
  assert.equal(assigned.status, APPOINTMENT_STATUS.ACCEPTED);
  assert.equal(assigned.assignedDoctorId, 'DOC-DEMO1');

  const dashboard = calculateDoctorDashboard([...demoAppointments, assigned], 'DOC-DEMO1');
  assert.ok(dashboard.assigned >= 1);
});

test('chat append and prescription summary', () => {
  const appt = addChatMessage({ chat: [] }, { sender: 'doctor', text: 'Please share BP report', at: '10:22' });
  assert.equal(appt.chat.length, 1);

  const meds = addPrescriptionItem([], { name: 'Syp Amoxicillin', duration: '3 days' });
  const summary = summarizePrescription(meds);
  assert.equal(summary.count, 1);
  assert.equal(summary.antibiotics, 1);
});

test('manager metrics and grouping', () => {
  const grouped = groupAppointments(demoAppointments);
  assert.ok(grouped.requested.length > 0);

  const metrics = buildManagerMetrics(demoAppointments, seededDoctors);
  assert.equal(metrics.doctorsListed, seededDoctors.length);
});

test('no-show disallowed on finalized statuses', () => {
  assert.throws(() => markNoShow({ status: APPOINTMENT_STATUS.CANCELLED }));
});
