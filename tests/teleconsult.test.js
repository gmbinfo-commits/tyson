import test from 'node:test';
import assert from 'node:assert/strict';
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
