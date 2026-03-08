import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPOINTMENT_STATUS,
  groupAppointments,
  startConsultation,
  completeConsultation,
  markNoShow,
  buildManagerMetrics
} from '../src/teleconsult.js';
import {
  createDoctor,
  loginDoctor,
  addAvailabilitySlot,
  seededDoctors,
  updateDoctorProfile
} from '../src/doctor.js';
import { addPrescriptionItem, formatPrescription } from '../src/prescription.js';

test('startConsultation updates status to in_progress', () => {
  const result = startConsultation({ id: '1', status: APPOINTMENT_STATUS.UPCOMING });
  assert.equal(result.status, APPOINTMENT_STATUS.IN_PROGRESS);
  assert.ok(result.startedAt);
});

test('completeConsultation captures payload and marks completed', () => {
  const result = completeConsultation(
    { id: '1', status: APPOINTMENT_STATUS.IN_PROGRESS },
    { notes: 'Stable', diagnosis: 'URI', followUpDate: '2026-03-31', prescription: [{ name: 'Paracetamol' }] }
  );
  assert.equal(result.status, APPOINTMENT_STATUS.COMPLETED);
  assert.equal(result.diagnosis, 'URI');
  assert.deepEqual(result.prescription, [{ name: 'Paracetamol' }]);
});

test('groupAppointments returns bucketed statuses', () => {
  const grouped = groupAppointments([
    { id: '1', status: APPOINTMENT_STATUS.UPCOMING },
    { id: '2', status: APPOINTMENT_STATUS.NO_SHOW },
    { id: '3', status: APPOINTMENT_STATUS.UPCOMING }
  ]);
  assert.equal(grouped.upcoming.length, 2);
  assert.equal(grouped.no_show.length, 1);
});

test('doctor create/login/profile and slot flows work', () => {
  let doctors = [...seededDoctors];
  doctors = createDoctor(doctors, {
    name: 'Dr Test',
    email: 'test@tele.com',
    password: 'abc123',
    specialty: 'Dermatology',
    experienceYears: 4,
    consultationFee: 500
  });
  const doctor = loginDoctor(doctors, 'test@tele.com', 'abc123');
  const prof = updateDoctorProfile(doctor, { languages: ['English'], qualifications: 'MBBS' });
  const withSlot = addAvailabilitySlot(prof, { date: '2026-03-12', start: '09:00', end: '11:00' });
  assert.equal(withSlot.availability.length, 1);
  assert.equal(withSlot.profile.qualifications, 'MBBS');
});

test('prescription formatter works', () => {
  const meds = addPrescriptionItem([], { name: 'Paracetamol', dose: '650mg', frequency: '1-0-1', duration: '3d' });
  const text = formatPrescription(meds);
  assert.match(text, /Paracetamol/);
});

test('manager metrics aggregate counts', () => {
  const metrics = buildManagerMetrics(
    [
      { status: APPOINTMENT_STATUS.UPCOMING },
      { status: APPOINTMENT_STATUS.COMPLETED },
      { status: APPOINTMENT_STATUS.NO_SHOW }
    ],
    seededDoctors
  );
  assert.equal(metrics.totalAppointments, 3);
  assert.equal(metrics.completed, 1);
  assert.equal(metrics.doctorsOnboarded, seededDoctors.length);
});

test('markNoShow disallows completed appointment', () => {
  assert.throws(() => markNoShow({ id: '1', status: APPOINTMENT_STATUS.COMPLETED }));
});
