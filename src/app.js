import {
  demoAppointments,
  groupAppointments,
  startConsultation,
  completeConsultation,
  markNoShow,
  buildManagerMetrics,
  calculateDoctorDashboard,
  assignDoctor,
  addChatMessage,
  prescriptionInsights,
  CONSULT_MODE
} from './teleconsult.js';
import {
  seededDoctors,
  seededManagers,
  createDoctor,
  loginDoctor,
  loginManager,
  updateDoctorProfile,
  addAvailabilitySlot,
  updateDoctorPerformance
} from './doctor.js';
import { addPrescriptionItem, summarizePrescription } from './prescription.js';

const storageKey = 'teleconsult_v2_state';
const initial = loadState();

const state = {
  authRoleTab: 'doctor',
  workspaceTab: 'queue',
  queueType: 'scheduled',
  queueStatus: 'requested',
  appointments: initial.appointments,
  doctors: initial.doctors,
  managers: initial.managers,
  currentDoctorId: initial.currentDoctorId,
  currentManagerId: initial.currentManagerId,
  selectedAppointmentId: null,
  prescriptionItems: []
};

const $ = (selector) => document.querySelector(selector);

bindEvents();
render();

function bindEvents() {
  document.querySelectorAll('[data-role-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.authRoleTab = tab.dataset.roleTab;
      renderAuthForms();
    });
  });

  $('#doctor-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const doctor = loginDoctor(state.doctors, $('#doctor-login-email').value, $('#doctor-login-password').value);
      state.currentDoctorId = doctor.id;
      state.currentManagerId = null;
      $('#auth-message').textContent = `Doctor logged in: ${doctor.name}`;
      persist();
      render();
    } catch (error) {
      $('#auth-message').textContent = error.message;
    }
  });

  $('#manager-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const manager = loginManager(state.managers, $('#manager-login-email').value, $('#manager-login-password').value);
      state.currentManagerId = manager.id;
      state.currentDoctorId = null;
      $('#auth-message').textContent = `Manager logged in: ${manager.name}`;
      persist();
      render();
    } catch (error) {
      $('#auth-message').textContent = error.message;
    }
  });

  $('#doctor-create-form').addEventListener('submit', (e) => {
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
      e.target.reset();
      persist();
      $('#auth-message').textContent = 'Doctor created successfully.';
      renderManagerWorkspace();
    } catch (error) {
      $('#auth-message').textContent = error.message;
    }
  });

  $('#doctor-logout').addEventListener('click', () => {
    state.currentDoctorId = null;
    state.selectedAppointmentId = null;
    persist();
    render();
  });

  $('#manager-logout').addEventListener('click', () => {
    state.currentManagerId = null;
    persist();
    render();
  });

  document.querySelectorAll('.workspace-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.workspaceTab = tab.dataset.workspaceTab;
      renderWorkspaceTabs();
    });
  });

  document.querySelectorAll('.queue-type-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.queueType = tab.dataset.queueType;
      renderQueue();
    });
  });

  document.querySelectorAll('.status-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.queueStatus = tab.dataset.statusTab;
      renderQueue();
    });
  });

  $('#open-start-consult').addEventListener('click', () => {
    const selected = selectedAppointment();
    if (!selected) return;
    $('#consult-mode-modal').showModal();
  });
  $('#close-modal').addEventListener('click', () => $('#consult-mode-modal').close());
  $('#start-audio').addEventListener('click', () => startSelectedConsult(CONSULT_MODE.AUDIO));
  $('#start-video').addEventListener('click', () => startSelectedConsult(CONSULT_MODE.VIDEO));

  $('#pick-instant').addEventListener('click', () => {
    mutateSelected((appointment) => {
      if (appointment.queueType !== 'instant') throw new Error('Only instant queue cases can be picked');
      const doctor = currentDoctor();
      if (!doctor) throw new Error('Doctor login required');
      return assignDoctor(appointment, doctor.id);
    });
    updateDoctorPerf('instantPicked', 1);
  });

  $('#mark-no-show').addEventListener('click', () => mutateSelected((appointment) => markNoShow(appointment, 'patient')));

  $('#add-med').addEventListener('click', () => {
    try {
      state.prescriptionItems = addPrescriptionItem(state.prescriptionItems, {
        name: $('#med-name').value,
        dose: $('#med-dose').value,
        frequency: $('#med-frequency').value,
        duration: $('#med-duration').value,
        remark: $('#med-remark').value
      });
      ['#med-name', '#med-dose', '#med-frequency', '#med-duration', '#med-remark'].forEach((x) => ($(x).value = ''));
      renderPrescriptionItems();
    } catch (error) {
      window.alert(error.message);
    }
  });

  $('#consult-form').addEventListener('submit', (e) => {
    e.preventDefault();
    mutateSelected((appointment) =>
      completeConsultation(appointment, {
        notes: $('#notes').value.trim(),
        diagnosis: $('#diagnosis').value.trim(),
        followUpDate: $('#followup').value,
        prescription: [...state.prescriptionItems],
        advice: $('#advice').value.trim()
      })
    );
    state.prescriptionItems = [];
    updateDoctorPerf('completed', 1);
    render();
  });

  $('#send-chat').addEventListener('click', () => {
    const text = $('#chat-input').value.trim();
    if (!text) return;
    mutateSelected((appointment) => addChatMessage(appointment, { sender: 'doctor', text, at: new Date().toLocaleTimeString() }));
    $('#chat-input').value = '';
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
    persist();
    renderDoctorWorkspace();
  });

  $('#availability-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const doctor = currentDoctor();
    if (!doctor) return;
    try {
      replaceDoctor(
        addAvailabilitySlot(doctor, {
          date: $('#slot-date').value,
          start: $('#slot-start').value,
          end: $('#slot-end').value
        })
      );
      e.target.reset();
      persist();
      renderAvailability();
    } catch (error) {
      window.alert(error.message);
    }
  });
}

function startSelectedConsult(mode) {
  mutateSelected((appointment) => startConsultation(appointment, mode));
  $('#consult-mode-modal').close();
}

function updateDoctorPerf(key, inc) {
  const doctor = currentDoctor();
  if (!doctor) return;
  replaceDoctor(updateDoctorPerformance(doctor, { [key]: (doctor.performance[key] || 0) + inc }));
  persist();
}

function mutateSelected(transform) {
  const idx = state.appointments.findIndex((x) => x.id === state.selectedAppointmentId);
  if (idx < 0) return;
  try {
    state.appointments[idx] = transform(state.appointments[idx]);
    persist();
    render();
  } catch (error) {
    window.alert(error.message);
  }
}

function render() {
  renderAuthForms();
  renderWorkspaceVisibility();
  renderDoctorWorkspace();
  renderManagerWorkspace();
}

function renderAuthForms() {
  document.querySelectorAll('[data-role-tab]').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.roleTab === state.authRoleTab);
  });
  $('#doctor-login-form').classList.toggle('hidden', state.authRoleTab !== 'doctor');
  $('#manager-login-form').classList.toggle('hidden', state.authRoleTab !== 'manager');
  $('#doctor-create-form').classList.toggle('hidden', state.authRoleTab !== 'onboard');
}

function renderWorkspaceVisibility() {
  $('#doctor-workspace').classList.toggle('hidden', !state.currentDoctorId);
  $('#manager-workspace').classList.toggle('hidden', !state.currentManagerId);
}

function renderDoctorWorkspace() {
  const doctor = currentDoctor();
  if (!doctor) return;

  $('#doctor-heading').textContent = `${doctor.name} · ${doctor.specialty}`;
  $('#profile-about').value = doctor.profile.about || '';
  $('#profile-languages').value = (doctor.profile.languages || []).join(', ');
  $('#profile-qualifications').value = doctor.profile.qualifications || '';

  renderWorkspaceTabs();
  renderQueue();
  renderDoctorDashboard();
  renderAvailability();
}

function renderWorkspaceTabs() {
  document.querySelectorAll('.workspace-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.workspaceTab === state.workspaceTab);
  });
  document.querySelectorAll('.workspace-view').forEach((view) => {
    view.classList.toggle('hidden', view.id !== `ws-${state.workspaceTab}`);
  });
}

function renderQueue() {
  document.querySelectorAll('.queue-type-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.queueType === state.queueType);
  });
  document.querySelectorAll('.status-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.statusTab === state.queueStatus);
  });

  const doctor = currentDoctor();
  if (!doctor) return;

  const grouped = groupAppointments(state.appointments);
  const byStatus = grouped[state.queueStatus] || [];
  const filtered = byStatus.filter(
    (appointment) =>
      appointment.queueType === state.queueType &&
      (appointment.assignedDoctorId === doctor.id || appointment.queueType === 'instant' || !appointment.assignedDoctorId)
  );

  const list = $('#queue-list');
  if (!filtered.length) {
    list.innerHTML = '<p class="muted">No cases in this queue.</p>';
    $('#appointment-detail').classList.add('hidden');
    $('#empty-detail').classList.remove('hidden');
    return;
  }

  list.innerHTML = filtered
    .map(
      (a) => `<article class="queue-card ${state.selectedAppointmentId === a.id ? 'selected' : ''}" data-id="${a.id}">
        <strong>${a.patientName}</strong>
        <div class="muted">${a.id} · ${a.time} · ${a.queueType}</div>
        <div class="badge">${a.status}</div>
      </article>`
    )
    .join('');

  list.querySelectorAll('.queue-card').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedAppointmentId = el.dataset.id;
      state.prescriptionItems = [];
      renderAppointmentDetail();
      renderQueue();
    });
  });

  renderAppointmentDetail();
}

function renderAppointmentDetail() {
  const appointment = selectedAppointment();
  if (!appointment) {
    $('#appointment-detail').classList.add('hidden');
    $('#empty-detail').classList.remove('hidden');
    return;
  }

  $('#appointment-detail').classList.remove('hidden');
  $('#empty-detail').classList.add('hidden');
  $('#appt-title').textContent = `${appointment.patientName} (${appointment.age})`;
  $('#appt-meta').textContent = `${appointment.id} · ${appointment.status} · ${appointment.consultMode || 'not started'}`;
  $('#appt-symptoms').textContent = appointment.symptoms;
  $('#appt-reports').textContent = appointment.reports.length ? appointment.reports.join(', ') : 'No reports uploaded';

  $('#open-start-consult').disabled = !['requested', 'accepted'].includes(appointment.status);
  $('#mark-no-show').disabled = ['completed', 'cancelled'].includes(appointment.status);
  $('#pick-instant').disabled = appointment.queueType !== 'instant' || appointment.assignedDoctorId !== null;
  $('#consult-form button[type="submit"]').disabled = appointment.status !== 'in_progress';

  $('#notes').value = appointment.notes || '';
  $('#diagnosis').value = appointment.diagnosis || '';
  $('#advice').value = appointment.advice || '';
  $('#followup').value = appointment.followUpDate || '';

  renderChat();
  renderPrescriptionItems(appointment.prescription || []);
}

function renderChat() {
  const appointment = selectedAppointment();
  if (!appointment) return;
  const chat = appointment.chat || [];
  $('#chat-messages').innerHTML = chat
    .map((m) => `<div class="chat ${m.sender === 'doctor' ? 'doctor' : 'patient'}"><strong>${m.sender}:</strong> ${m.text} <span>${m.at}</span></div>`)
    .join('');
}

function renderPrescriptionItems(existing = null) {
  const source = existing || state.prescriptionItems;
  const list = $('#rx-list');
  if (!source.length) {
    list.innerHTML = '<li class="muted">No medicines added.</li>';
    return;
  }
  list.innerHTML = source.map((m) => `<li>${m.name} · ${m.dose} · ${m.frequency} · ${m.duration}</li>`).join('');
}

function renderDoctorDashboard() {
  const doctor = currentDoctor();
  if (!doctor) return;
  const calc = calculateDoctorDashboard(state.appointments, doctor.id);
  const summary = summarizePrescription(state.appointments.flatMap((a) => a.prescription || []));

  const metricCards = {
    Assigned: calc.assigned,
    Completed: calc.completed,
    'Instant Picked': calc.instant,
    'Completion %': calc.completionRate,
    Rating: doctor.performance.rating
  };

  $('#doctor-metrics').innerHTML = Object.entries(metricCards)
    .map(([k, v]) => `<article class="metric"><h4>${k}</h4><p>${v}</p></article>`)
    .join('');

  const insights = {
    'Adherence Score': `${prescriptionInsights.adherenceScore}%`,
    'High Risk Flag Rate': `${prescriptionInsights.highRiskFlagRate}%`,
    'Rx in System': summary.count,
    'Antibiotic Use': summary.antibiotics,
    Guidance: prescriptionInsights.topAdvice
  };

  $('#doctor-prescription-insights').innerHTML = Object.entries(insights)
    .map(([k, v]) => `<article class="metric"><h4>${k}</h4><p>${v}</p></article>`)
    .join('');
}

function renderAvailability() {
  const doctor = currentDoctor();
  if (!doctor) return;
  const list = $('#availability-list');
  list.innerHTML = doctor.availability.length
    ? doctor.availability.map((s) => `<li>${s.date}: ${s.start}-${s.end}</li>`).join('')
    : '<li class="muted">No slots added.</li>';
}

function renderManagerWorkspace() {
  const manager = currentManager();
  if (!manager) return;
  $('#manager-heading').textContent = `Logged in as ${manager.name}`;

  const metrics = buildManagerMetrics(state.appointments, state.doctors);
  $('#manager-metrics').innerHTML = Object.entries(metrics)
    .map(([k, v]) => `<article class="metric"><h4>${k}</h4><p>${v}</p></article>`)
    .join('');

  $('#manager-doctors').innerHTML = state.doctors
    .map(
      (doctor) => `<article class="queue-card">
      <strong>${doctor.name}</strong>
      <div class="muted">${doctor.specialty} · ${doctor.email}</div>
      <div class="muted">Completed: ${doctor.performance.completed} · Instant: ${doctor.performance.instantPicked}</div>
    </article>`
    )
    .join('');

  $('#manager-instant-queue').innerHTML = state.appointments
    .filter((a) => a.queueType === 'instant' && ['requested', 'accepted'].includes(a.status))
    .map(
      (a) => `<article class="queue-card">
      <strong>${a.patientName}</strong>
      <div class="muted">${a.id} · ${a.status}</div>
      <div class="muted">Assigned: ${a.assignedDoctorId || 'Unassigned'}</div>
    </article>`
    )
    .join('');
}

function selectedAppointment() {
  return state.appointments.find((x) => x.id === state.selectedAppointmentId) || null;
}

function currentDoctor() {
  return state.doctors.find((x) => x.id === state.currentDoctorId) || null;
}

function currentManager() {
  return state.managers.find((x) => x.id === state.currentManagerId) || null;
}

function replaceDoctor(doctor) {
  state.doctors = state.doctors.map((x) => (x.id === doctor.id ? doctor : x));
}

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return {
      appointments: [...demoAppointments],
      doctors: [...seededDoctors],
      managers: [...seededManagers],
      currentDoctorId: null,
      currentManagerId: null
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      appointments: parsed.appointments || [...demoAppointments],
      doctors: parsed.doctors || [...seededDoctors],
      managers: parsed.managers || [...seededManagers],
      currentDoctorId: parsed.currentDoctorId || null,
      currentManagerId: parsed.currentManagerId || null
    };
  } catch {
    return {
      appointments: [...demoAppointments],
      doctors: [...seededDoctors],
      managers: [...seededManagers],
      currentDoctorId: null,
      currentManagerId: null
    };
  }
}

function persist() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      appointments: state.appointments,
      doctors: state.doctors,
      managers: state.managers,
      currentDoctorId: state.currentDoctorId,
      currentManagerId: state.currentManagerId
    })
  );
}
