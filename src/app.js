import {
  demoAppointments,
  groupAppointments,
  startConsultation,
  completeConsultation,
  markNoShow,
  buildManagerMetrics
} from './teleconsult.js';
import {
  seededDoctors,
  createDoctor,
  loginDoctor,
  updateDoctorProfile,
  addAvailabilitySlot
} from './doctor.js';
import { addPrescriptionItem, formatPrescription } from './prescription.js';

const storageKey = 'teleconsult_v1_state';
const initial = loadState();
const state = {
  activeQueueTab: 'upcoming',
  selectedId: null,
  authTab: 'login',
  featureTab: 'queue',
  appointments: initial.appointments,
  doctors: initial.doctors,
  currentDoctorId: initial.currentDoctorId,
  prescriptionItems: []
};

const $ = (s) => document.querySelector(s);
const authMsg = $('#auth-result');
const doctorStatus = $('#doctor-status');

bindAuthTabs();
bindFeatureTabs();
bindQueueTabs();
bindForms();
renderAll();

function bindAuthTabs() {
  document.querySelectorAll('[data-auth-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.authTab = tab.dataset.authTab;
      document.querySelectorAll('[data-auth-tab]').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      $('#login-form').classList.toggle('hidden', state.authTab !== 'login');
      $('#create-doctor-form').classList.toggle('hidden', state.authTab !== 'create');
    });
  });
}

function bindFeatureTabs() {
  document.querySelectorAll('.feature-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.featureTab = tab.dataset.feature;
      renderFeatureTab();
    });
  });
}

function bindQueueTabs() {
  document.querySelectorAll('.queue-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeQueueTab = tab.dataset.tab;
      document.querySelectorAll('.queue-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderQueue();
    });
  });
}

function bindForms() {
  $('#create-doctor-form').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      state.doctors = createDoctor(state.doctors, {
        name: $('#doctor-name').value,
        email: $('#doctor-email').value,
        password: $('#doctor-password').value,
        specialty: $('#doctor-specialty').value,
        experienceYears: $('#doctor-experience').value,
        consultationFee: $('#doctor-fee').value
      });
      persistState();
      authMsg.textContent = 'Doctor created successfully. You can login now.';
      e.target.reset();
      renderManager();
    } catch (err) {
      authMsg.textContent = err.message;
    }
  });

  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const doctor = loginDoctor(state.doctors, $('#login-email').value, $('#login-password').value);
      state.currentDoctorId = doctor.id;
      persistState();
      authMsg.textContent = `Logged in as ${doctor.name}`;
      renderCurrentDoctor();
      renderManager();
    } catch (err) {
      authMsg.textContent = err.message;
    }
  });

  $('#logout-btn').addEventListener('click', () => {
    state.currentDoctorId = null;
    state.selectedId = null;
    persistState();
    renderCurrentDoctor();
  });

  $('#start-btn').addEventListener('click', () => mutateSelected((x) => startConsultation(x)));
  $('#noshow-btn').addEventListener('click', () => mutateSelected((x) => markNoShow(x, 'patient')));

  $('#add-med-btn').addEventListener('click', () => {
    try {
      state.prescriptionItems = addPrescriptionItem(state.prescriptionItems, {
        name: $('#med-name').value,
        dose: $('#med-dose').value,
        frequency: $('#med-frequency').value,
        duration: $('#med-duration').value
      });
      ['#med-name', '#med-dose', '#med-frequency', '#med-duration'].forEach((id) => ($(id).value = ''));
      renderPrescriptionList();
    } catch (err) {
      window.alert(err.message);
    }
  });

  $('#consult-form').addEventListener('submit', (e) => {
    e.preventDefault();
    mutateSelected((appointment) =>
      completeConsultation(appointment, {
        notes: $('#notes').value.trim(),
        diagnosis: $('#diagnosis').value.trim(),
        followUpDate: $('#followup').value,
        prescription: [...state.prescriptionItems]
      })
    );
    state.prescriptionItems = [];
    renderPrescriptionList();
    renderManager();
  });

  $('#profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const doctor = currentDoctor();
    if (!doctor) return;
    const updated = updateDoctorProfile(doctor, {
      about: $('#profile-about').value.trim(),
      qualifications: $('#profile-qualifications').value.trim(),
      languages: $('#profile-languages')
        .value.split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    });
    replaceDoctor(updated);
    persistState();
    doctorStatus.textContent = `Profile updated for ${updated.name}.`;
    renderManager();
  });

  $('#availability-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const doctor = currentDoctor();
    if (!doctor) return;
    try {
      const updated = addAvailabilitySlot(doctor, {
        date: $('#slot-date').value,
        start: $('#slot-start').value,
        end: $('#slot-end').value
      });
      replaceDoctor(updated);
      persistState();
      e.target.reset();
      renderAvailability();
      renderManager();
    } catch (err) {
      window.alert(err.message);
    }
  });
}

function renderAll() {
  renderCurrentDoctor();
  renderFeatureTab();
  renderQueue();
  renderConsultation();
  renderManager();
}

function renderCurrentDoctor() {
  const doctor = currentDoctor();
  if (!doctor) {
    doctorStatus.textContent = 'Not logged in. Login to access doctor workspace.';
    return;
  }
  doctorStatus.textContent = `Logged in: ${doctor.name} · ${doctor.specialty} · ${doctor.experienceYears} years`;
  $('#profile-about').value = doctor.profile.about || '';
  $('#profile-qualifications').value = doctor.profile.qualifications || '';
  $('#profile-languages').value = (doctor.profile.languages || []).join(', ');
  renderAvailability();
}

function renderFeatureTab() {
  document.querySelectorAll('.feature-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.feature === state.featureTab);
  });
  document.querySelectorAll('.feature-view').forEach((view) => {
    view.classList.toggle('hidden', view.id !== `feature-${state.featureTab}`);
  });
}

function renderQueue() {
  const grouped = groupAppointments(state.appointments);
  const current = grouped[state.activeQueueTab];
  const listEl = $('#appointment-list');

  if (!current.length) {
    listEl.innerHTML = '<p>No appointments in this status.</p>';
    return;
  }

  listEl.innerHTML = current
    .map(
      (a) => `<article class="card ${state.selectedId === a.id ? 'active' : ''}" data-id="${a.id}">
      <strong>${a.time} · ${a.patientName}</strong>
      <div>Age ${a.age} · ${a.id}</div>
      <div>${a.symptoms}</div>
    </article>`
    )
    .join('');

  listEl.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      state.selectedId = card.dataset.id;
      state.prescriptionItems = [];
      renderQueue();
      renderConsultation();
    });
  });
}

function renderConsultation() {
  const selected = state.appointments.find((x) => x.id === state.selectedId);
  if (!selected) {
    $('#empty-state').classList.remove('hidden');
    $('#consultation-view').classList.add('hidden');
    return;
  }

  $('#empty-state').classList.add('hidden');
  $('#consultation-view').classList.remove('hidden');
  $('#patient-title').textContent = selected.patientName;
  $('#patient-meta').textContent = `Appointment ${selected.id} · Status: ${selected.status}`;
  $('#patient-symptoms').textContent = selected.symptoms;
  $('#patient-reports').textContent = selected.reports.length ? selected.reports.join(', ') : 'No uploads';

  $('#notes').value = selected.notes || '';
  $('#diagnosis').value = selected.diagnosis || '';
  $('#followup').value = selected.followUpDate || '';

  $('#start-btn').disabled = selected.status !== 'upcoming';
  $('#noshow-btn').disabled = ['completed', 'no_show'].includes(selected.status);
  $('#consult-form button[type="submit"]').disabled = selected.status !== 'in_progress';

  renderPrescriptionList(selected.prescription || []);
}

function renderPrescriptionList(existing = null) {
  const list = $('#prescription-list');
  const source = existing === null ? state.prescriptionItems : existing;
  if (!source.length) {
    list.innerHTML = '<li class="muted">No medicines added yet.</li>';
    return;
  }
  list.innerHTML = source
    .map((m) => `<li>${m.name} — ${m.dose} — ${m.frequency} — ${m.duration}</li>`)
    .join('');
}

function renderAvailability() {
  const doctor = currentDoctor();
  const list = $('#availability-list');
  if (!doctor) {
    list.innerHTML = '<li class="muted">Login to manage slots.</li>';
    return;
  }
  if (!doctor.availability.length) {
    list.innerHTML = '<li class="muted">No slots added yet.</li>';
    return;
  }
  list.innerHTML = doctor.availability
    .map((s) => `<li>${s.date}: ${s.start} - ${s.end}</li>`)
    .join('');
}

function renderManager() {
  const metrics = buildManagerMetrics(state.appointments, state.doctors);
  $('#manager-metrics').innerHTML = Object.entries(metrics)
    .map(([k, v]) => `<article class="metric"><h5>${k}</h5><p>${v}</p></article>`)
    .join('');

  $('#manager-doctors').innerHTML = state.doctors
    .map(
      (d) => `<article class="card">
      <strong>${d.name}</strong>
      <div>${d.specialty} · ${d.experienceYears} yrs · ₹${d.consultationFee}</div>
      <div>Slots: ${d.availability.length}</div>
      <div>Profile: ${d.profile.qualifications || 'Not updated'}</div>
    </article>`
    )
    .join('');
}

function mutateSelected(transform) {
  const idx = state.appointments.findIndex((x) => x.id === state.selectedId);
  if (idx < 0) return;
  try {
    state.appointments[idx] = transform(state.appointments[idx]);
    persistState();
    renderQueue();
    renderConsultation();
  } catch (err) {
    window.alert(err.message);
  }
}

function currentDoctor() {
  return state.doctors.find((d) => d.id === state.currentDoctorId) || null;
}

function replaceDoctor(updated) {
  state.doctors = state.doctors.map((d) => (d.id === updated.id ? updated : d));
}

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return { appointments: [...demoAppointments], doctors: [...seededDoctors], currentDoctorId: null };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      appointments: parsed.appointments || [...demoAppointments],
      doctors: parsed.doctors || [...seededDoctors],
      currentDoctorId: parsed.currentDoctorId || null
    };
  } catch {
    return { appointments: [...demoAppointments], doctors: [...seededDoctors], currentDoctorId: null };
  }
}

function persistState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      appointments: state.appointments,
      doctors: state.doctors,
      currentDoctorId: state.currentDoctorId
    })
  );
}

window.__teleconsultDebug = { state, formatPrescription };
