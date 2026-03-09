import { roles, doctors as seedDoctors, managers as seedManagers, admins as seedAdmins, patients as seedPatients, cases as seedCases, appointments as seedAppointments, prescriptions as seedPrescriptions, analytics as seedAnalytics } from './mockData.js';
import { queueBuckets, assignCaseToDoctor, startCaseConsult, closeCase, addCaseNote, addChatMessage, managerInsights, doctorInsights } from './teleconsult.js';
import { createDoctor, loginByRole, updateDoctor, updateDoctorProfileSection, setDoctorAvailability } from './doctor.js';
import { createPrescriptionDraft, addMedicine, finalizePrescription, prescriptionToPrintableText } from './prescription.js';

const STORAGE = 'tele_ops_v3';
const state = load();

const roleNav = {
  doctor: ['dashboard', 'queue', 'active_consult', 'case_history', 'slots', 'prescriptions', 'profile'],
  manager: ['manager_dashboard', 'case_queue', 'assignment_console', 'case_detail', 'doctor_operations', 'payouts', 'reports'],
  admin: ['admin_dashboard', 'doctor_master', 'configuration', 'audit_logs', 'analytics_dashboard']
};

const labels = {
  dashboard: 'Doctor Dashboard',
  queue: 'My Queue',
  active_consult: 'Active Consult',
  case_history: 'Patients / Case History',
  slots: 'Slot & Availability',
  prescriptions: 'Prescriptions',
  profile: 'Profile',
  manager_dashboard: 'Live Operations Dashboard',
  case_queue: 'Case Queue',
  assignment_console: 'Case Assignment Console',
  case_detail: 'Case Detail View',
  doctor_operations: 'Doctor Operations',
  payouts: 'Payouts & Pricing',
  reports: 'Reports / Insights',
  admin_dashboard: 'Admin Dashboard',
  doctor_master: 'Doctor Master',
  configuration: 'Configuration',
  audit_logs: 'Audit & Logs',
  analytics_dashboard: 'Analytics Dashboard'
};

const $ = (s) => document.querySelector(s);

mountApp();
bind();
render();

function mountApp() {
  const root = document.getElementById('app');
  if (!root) throw new Error('Missing #app root container');
  root.innerHTML = `
    <div class="layout">
      <aside id="sidebar" class="sidebar"></aside>
      <div class="main-wrap">
        <header id="topbar" class="topbar"></header>
        <section id="login-area"></section>
        <main id="content" class="content"></main>
      </div>
      <aside id="drawer" class="drawer hidden"></aside>
    </div>
  `;
}

function bind() {
  document.body.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      state.page = nav.dataset.nav;
      render();
      return;
    }

    if (e.target.matches('[data-role-select]')) {
      state.loginRole = e.target.dataset.roleSelect;
      renderLogin();
      return;
    }

    if (e.target.matches('[data-open-case]')) {
      state.selectedCaseId = e.target.dataset.openCase;
      if (state.role === 'doctor') state.page = 'active_consult';
      if (state.role === 'manager') state.page = 'case_detail';
      render();
      return;
    }

    if (e.target.matches('[data-assign-doctor]')) {
      const caseId = e.target.dataset.caseId;
      const doctorId = e.target.dataset.assignDoctor;
      const idx = state.cases.findIndex((c) => c.id === caseId);
      if (idx >= 0) state.cases[idx] = assignCaseToDoctor(state.cases[idx], doctorId, state.role);
      persist();
      render();
      return;
    }

    if (e.target.matches('#start-audio') || e.target.matches('#start-video')) {
      const mode = e.target.matches('#start-audio') ? 'audio' : 'video';
      mutateCase((c) => startCaseConsult(c, mode));
      return;
    }

    if (e.target.matches('#complete-case')) {
      mutateCase((c) => closeCase(c));
      return;
    }

    if (e.target.matches('#add-note')) {
      const note = $('#note-input').value.trim();
      if (!note) return;
      mutateCase((c) => addCaseNote(c, note));
      $('#note-input').value = '';
      return;
    }

    if (e.target.matches('#send-chat')) {
      const txt = $('#chat-input').value.trim();
      if (!txt) return;
      mutateCase((c) => addChatMessage(c, { sender: state.role, text: txt, at: new Date().toLocaleTimeString() }));
      $('#chat-input').value = '';
      return;
    }

    if (e.target.matches('[data-preview-attachment]')) {
      const { caseId, attachmentId } = e.target.dataset;
      const c = state.cases.find((x) => x.id === caseId);
      const a = c?.attachments.find((x) => x.id === attachmentId);
      if (!a) return;
      openDrawer('attachment', `<h3>${a.name}</h3><p>Uploaded: ${a.uploadedAt}</p><a class="btn" href="${a.url}" download="${a.name}">Download</a>`);
      return;
    }

    if (e.target.matches('[data-preview-prescription]')) {
      const rxId = e.target.dataset.previewPrescription;
      const rx = state.prescriptions.find((r) => r.id === rxId);
      if (!rx) return;
      const doctor = state.doctors.find((d) => d.id === rx.doctorId);
      openDrawer('prescription', `<pre>${prescriptionToPrintableText(rx, doctor?.name || 'Doctor')}</pre><button class="btn" id="download-rx" data-rx-id="${rx.id}">Download Prescription</button>`);
      return;
    }

    if (e.target.matches('#download-rx')) {
      const rx = state.prescriptions.find((r) => r.id === e.target.dataset.rxId);
      if (!rx) return;
      const blob = new Blob([prescriptionToPrintableText(rx)], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rx.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (e.target.matches('#drawer-close')) {
      closeDrawer();
      return;
    }

    if (e.target.matches('[data-toggle-settlement]')) {
      const id = e.target.dataset.toggleSettlement;
      const row = state.appointments.find((a) => a.id === id);
      if (!row) return;
      row.settlementStatus = row.settlementStatus === 'settled' ? 'unsettled' : 'settled';
      persist();
      renderPage();
      return;
    }

    if (e.target.matches('[data-edit-payout]')) {
      const id = e.target.dataset.editPayout;
      const entry = state.appointments.find((a) => a.id === id);
      const adjustment = Number(prompt('Adjustment amount', String(entry.adjustment || 0)) || 0);
      entry.adjustment = adjustment;
      entry.finalPayable = entry.payoutSnapshot + adjustment;
      persist();
      renderPage();
      return;
    }

    if (e.target.matches('[data-admin-edit-doctor]')) {
      const id = e.target.dataset.adminEditDoctor;
      const doctor = state.doctors.find((d) => d.id === id);
      const newFee = Number(prompt('Consult fee', String(doctor.consultFee)) || doctor.consultFee);
      const newPayout = Number(prompt('Payout rate', String(doctor.payoutRate)) || doctor.payoutRate);
      Object.assign(doctor, updateDoctor(doctor, { consultFee: newFee, payoutRate: newPayout }));
      persist();
      renderPage();
      return;
    }
  });

  document.body.addEventListener('submit', (e) => {
    if (e.target.matches('#login-form')) {
      e.preventDefault();
      const email = $('#login-email').value;
      const password = $('#login-password').value;
      try {
        if (state.loginRole === 'doctor') state.user = loginByRole(state.doctors, email, password);
        if (state.loginRole === 'manager') state.user = loginByRole(state.managers, email, password);
        if (state.loginRole === 'admin') state.user = loginByRole(state.admins, email, password);
        state.role = state.loginRole;
        state.page = roleNav[state.role][0];
        persist();
        render();
      } catch (err) {
        $('#login-error').textContent = err.message;
      }
      return;
    }

    if (e.target.matches('#create-doctor-form')) {
      e.preventDefault();
      state.doctors = createDoctor(state.doctors, {
        name: $('#new-doc-name').value,
        email: $('#new-doc-email').value,
        password: $('#new-doc-pass').value,
        specialty: $('#new-doc-spec').value,
        consultFee: $('#new-doc-fee').value,
        payoutRate: $('#new-doc-payout').value
      });
      persist();
      e.target.reset();
      alert('Doctor created');
      renderPage();
      return;
    }

    if (e.target.matches('#profile-edit-form')) {
      e.preventDefault();
      const d = currentDoctor();
      Object.assign(d, updateDoctorProfileSection(d, {
        bio: $('#prof-bio').value,
        languages: $('#prof-langs').value.split(',').map((x) => x.trim()).filter(Boolean),
        specialties: $('#prof-spec').value.split(',').map((x) => x.trim()).filter(Boolean),
        degrees: $('#prof-deg').value.split(',').map((x) => x.trim()).filter(Boolean)
      }));
      persist();
      alert('Profile updated');
      renderPage();
      return;
    }

    if (e.target.matches('#slot-form')) {
      e.preventDefault();
      const day = $('#slot-day').value;
      const slots = $('#slot-values').value.split(',').map((x) => x.trim()).filter(Boolean);
      const doc = currentDoctor();
      Object.assign(doc, setDoctorAvailability(doc, day, slots));
      persist();
      renderPage();
      return;
    }

    if (e.target.matches('#prescription-form')) {
      e.preventDefault();
      const c = selectedCase();
      if (!c) return;
      let rx = state.prescriptions.find((r) => r.caseId === c.id && r.state === 'draft');
      if (!rx) {
        rx = createPrescriptionDraft(c.id, c.assignedDoctorId || currentDoctor()?.id || '');
        state.prescriptions.push(rx);
      }
      rx.chiefComplaints = $('#rx-cc').value;
      rx.diagnosis = $('#rx-dx').value;
      rx.advice = $('#rx-advice').value;
      rx.investigations = $('#rx-investigation').value;
      rx.followUp = $('#rx-followup').value;
      rx.medicines = [{
        name: $('#rx-med').value,
        dose: $('#rx-dose').value,
        frequency: $('#rx-freq').value,
        duration: $('#rx-dur').value,
        remark: $('#rx-remark').value
      }];
      if ($('#rx-final').checked) Object.assign(rx, finalizePrescription(rx));
      if (!c.prescriptionIds.includes(rx.id)) c.prescriptionIds.push(rx.id);
      persist();
      alert('Prescription saved');
      renderPage();
      return;
    }
  });
}

function mutateCase(fn) {
  const idx = state.cases.findIndex((c) => c.id === state.selectedCaseId);
  if (idx < 0) return;
  state.cases[idx] = fn(state.cases[idx]);
  persist();
  renderPage();
}

function render() {
  renderShell();
  renderLogin();
  renderPage();
}

function renderShell() {
  const navItems = state.role ? roleNav[state.role] : [];
  $('#sidebar').innerHTML = `
    <div class="brand">TeleOps</div>
    ${state.role ? `<div class="role-chip">${state.role.toUpperCase()}</div>` : ''}
    <nav>${navItems.map((n) => `<button class="nav ${state.page === n ? 'active' : ''}" data-nav="${n}">${labels[n]}</button>`).join('')}</nav>
    <button class="nav logout" id="logout-btn">Logout</button>
  `;
  const logoutBtn = $('#logout-btn');
  if (logoutBtn) logoutBtn.onclick = () => { state.role = null; state.user = null; state.page = null; persist(); render(); };

  $('#topbar').innerHTML = `
    <h2>${state.page ? labels[state.page] : 'Role-based Teleconsult Platform'}</h2>
    <div class="top-actions">
      <input placeholder="Search cases, doctors, patients" />
      <span class="notif">🔔</span>
      <span class="badge">${state.role ? `${state.role} • ${state.user?.name}` : 'Guest'}</span>
    </div>
  `;
}

function renderLogin() {
  if (state.role) {
    $('#login-area').classList.add('hidden');
    return;
  }
  $('#login-area').classList.remove('hidden');
  $('#login-area').innerHTML = `
    <div class="login-card">
      <h3>Login</h3>
      <div class="role-tabs">
        ${roles.map((r) => `<button class="tab ${state.loginRole === r ? 'active' : ''}" data-role-select="${r}">${r}</button>`).join('')}
      </div>
      <form id="login-form" class="stack">
        <input id="login-email" type="email" placeholder="Email" required />
        <input id="login-password" type="password" placeholder="Password" required />
        <button class="btn primary" type="submit">Login as ${state.loginRole}</button>
      </form>
      <div id="login-error" class="danger"></div>
      <div class="demo">Doctor: neha@teleconsult.com / demo123 · Manager: manager@teleconsult.com / manager123 · Admin: admin@teleconsult.com / admin123</div>
    </div>
  `;
}

function renderPage() {
  if (!state.role) {
    $('#content').innerHTML = '<div class="empty">Please login to continue.</div>';
    return;
  }
  $('#content').innerHTML = pageMarkup(state.page);
}

function pageMarkup(page) {
  if (page === 'dashboard') return doctorDashboard();
  if (page === 'queue') return doctorQueue();
  if (page === 'active_consult') return activeConsult();
  if (page === 'case_history') return caseHistory();
  if (page === 'slots') return slotsPage();
  if (page === 'prescriptions') return prescriptionsPage();
  if (page === 'profile') return profilePage();

  if (page === 'manager_dashboard') return managerDashboard();
  if (page === 'case_queue') return managerCaseQueue();
  if (page === 'assignment_console') return assignmentConsole();
  if (page === 'case_detail') return managerCaseDetail();
  if (page === 'doctor_operations') return doctorOperations();
  if (page === 'payouts') return payoutsPage();
  if (page === 'reports') return analyticsDashboard();

  if (page === 'admin_dashboard') return adminDashboard();
  if (page === 'doctor_master') return doctorMaster();
  if (page === 'configuration') return '<div class="card">Pricing & payout rules config placeholder.</div>';
  if (page === 'audit_logs') return '<div class="card">Audit logs placeholder (doctor edits, assignments, payout changes).</div>';
  if (page === 'analytics_dashboard') return analyticsDashboard();

  return '<div class="empty">Select module</div>';
}

function doctorDashboard() {
  const d = currentDoctor();
  const ins = doctorInsights(state.cases, d.id);
  return `
  <div class="kpis">${kpi('Online Status', d.onlineStatus)}${kpi('Today Consults', seedAnalytics.doctorDashboard.todayConsults)}${kpi('Pending Queue', seedAnalytics.doctorDashboard.pendingQueue)}${kpi('Completed Today', seedAnalytics.doctorDashboard.completedToday)}${kpi('Next Slot', seedAnalytics.doctorDashboard.nextSlot)}${kpi('Closure %', ins.closureRate)}</div>
  <div class="grid-2">
    <div class="card"><h4>Quick Actions</h4><div class="stack">${quick('Open Queue','queue')}${quick('Start Active Consult','active_consult')}${quick('Manage Slots','slots')}${quick('View Prescriptions','prescriptions')}</div></div>
    <div class="card"><h4>Alerts / Follow-up</h4><ul><li>2 follow-ups due in next 24h</li><li>1 case approaching SLA</li><li>Prescription draft pending finalization</li></ul></div>
  </div>`;
}

function doctorQueue() {
  const d = currentDoctor();
  const q = queueBuckets(state.cases, d.id);
  const rows = Object.entries(q).flatMap(([bucket, arr]) => arr.map((c) => queueRow(c, bucket)));
  return `
  <div class="toolbar"><input placeholder="Search patient/case" /><select><option>Priority</option></select><select><option>Language</option></select><select><option>SLA</option></select></div>
  <div class="grid-2"><div class="card"><h4>Queue Buckets</h4><div class="chips">${Object.entries(q).map(([k,v])=>`<span class="chip">${k.replaceAll('_',' ')}: ${v.length}</span>`).join('')}</div><div>${rows.join('') || '<p class="muted">No cases</p>'}</div></div><div class="card"><h4>Selected Case Preview</h4>${casePreview(selectedCase() || state.cases[0])}</div></div>`;
}

function activeConsult() {
  const c = selectedCase() || state.cases[0];
  const p = state.patients.find((x) => x.id === c.patientId);
  return `
  <div class="grid-3">
    <div class="card"><h4>Patient Summary</h4>${patientSummary(p,c)}</div>
    <div class="card"><h4>Consult Workspace</h4>
      <div class="tabs-mini"><span class="chip">Summary</span><span class="chip">History</span><span class="chip">Analytics</span><span class="chip">Notes</span><span class="chip">Attachments</span></div>
      <div class="row"><button class="btn" id="start-audio">Start Audio</button><button class="btn" id="start-video">Start Video</button><button class="btn" id="complete-case">Mark Complete</button></div>
      <div class="stack"><textarea id="note-input" placeholder="Add consult note"></textarea><button class="btn" id="add-note">Add Note</button></div>
      <h5>Chat</h5>
      <div class="chatlist">${(c.chat||[]).map((m)=>`<div class="chat"><b>${m.sender}</b>: ${m.text}</div>`).join('')}</div>
      <div class="row"><input id="chat-input" placeholder="Message patient"/><button class="btn" id="send-chat">Send</button></div>
    </div>
    <div class="card"><h4>Prescription Builder</h4>${prescriptionForm(c)}</div>
  </div>`;
}

function caseHistory() {
  return `<div class="card"><h4>Case History</h4>${state.cases.map((c)=>`<div class="rowline"><b>${c.id}</b> - ${c.issue} <button class="link" data-open-case="${c.id}">Open</button></div>`).join('')}</div>`;
}

function slotsPage() {
  const d = currentDoctor();
  const days = Object.entries(d.weeklyAvailability);
  return `<div class="card"><h4>Weekly Slot Planner</h4><div class="toolbar"><button class="btn">Copy Previous Week</button><button class="btn">Apply Template</button><button class="btn">Block Leave</button><span class="chip">Slot Duration: 30 min</span></div><div class="slot-grid">${days.map(([day,slots])=>`<div><b>${day}</b><div class="chips">${slots.map(s=>`<span class="chip">${s}</span>`).join('')||'<span class="muted">No slots</span>'}</div></div>`).join('')}</div><form id="slot-form" class="toolbar"><select id="slot-day">${Object.keys(d.weeklyAvailability).map((d)=>`<option>${d}</option>`).join('')}</select><input id="slot-values" placeholder="09:00,09:30,10:00" /><button class="btn primary" type="submit">Update Day Slots</button></form></div>`;
}

function prescriptionsPage() {
  const relevant = state.role === 'doctor' ? state.prescriptions.filter((r)=>r.doctorId===currentDoctor().id) : state.prescriptions;
  return `<div class="card"><h4>Prescription Library</h4>${relevant.map((r)=>`<div class="rowline"><b>${r.id}</b> • ${r.state} • ${r.diagnosis || 'NA'} <button class="btn" data-preview-prescription="${r.id}">Preview</button></div>`).join('')}</div>`;
}

function profilePage() {
  const d = currentDoctor();
  return `<div class="grid-2"><div class="card"><h4>Doctor Profile (Rich)</h4><div class="row"><img src="${d.photoUrl}" width="72"/><img src="${d.signatureUrl}" width="160"/></div><p>${d.name} • ${d.gender} • ${d.experienceYears} years</p><div class="chips">${d.degrees.map(chip).join('')}${d.specialties.map(chip).join('')}${d.languages.map(chip).join('')}</div><p>Reg: ${d.registrationNumber}</p><p>Modes: ${d.consultationModes.join(', ')}</p><p>Payout: ₹${d.payoutRate} | Fee: ₹${d.consultFee}</p><h5>Documents</h5>${d.documents.map((doc)=>`<div class="rowline">${doc.name}<a href="${doc.url}" download="${doc.name}">Download</a></div>`).join('')}</div><div class="card"><h4>Edit</h4><form id="profile-edit-form" class="stack"><textarea id="prof-bio">${d.bio||''}</textarea><input id="prof-langs" value="${d.languages.join(', ')}"/><input id="prof-spec" value="${d.specialties.join(', ')}"/><input id="prof-deg" value="${d.degrees.join(', ')}"/><button class="btn primary">Save</button></form></div></div>`;
}

function managerDashboard() {
  const i = managerInsights(state.cases, state.doctors);
  return `<div class="kpis">${kpi('Doctors Online', i.online)}${kpi('Busy', i.busy)}${kpi('Waiting', i.waiting)}${kpi('Unassigned', i.unassigned)}${kpi('In Progress', i.inProgress)}${kpi('Closed', i.closed)}${kpi('Avg Wait', `${seedAnalytics.managerDashboard.avgWaitMins}m`)}${kpi('Closure', `${seedAnalytics.managerDashboard.closureRate}%`)}</div><div class="grid-2"><div class="card"><h4>Online Doctor Roster</h4>${state.doctors.map((d)=>`<div class="rowline">${d.name}<span class="chip">${d.onlineStatus}</span><span class="chip">Load:${d.performance.assigned}</span></div>`).join('')}</div><div class="card"><h4>Bottleneck / SLA</h4><ul><li>${seedAnalytics.managerDashboard.slaRiskCases} cases at SLA risk</li><li>2 instant cases > 10 mins</li><li>1 language mismatch assignment</li></ul></div></div>`;
}

function managerCaseQueue() {
  return `<div class="card"><h4>Case Queue</h4>${state.cases.map((c)=>queueRow(c,c.status)).join('')}</div>`;
}

function assignmentConsole() {
  const unassigned = state.cases.filter((c)=>!c.assignedDoctorId);
  return `<div class="grid-2"><div class="card"><h4>Unassigned Cases</h4>${unassigned.map((c)=>`<div class="rowline"><b>${c.id}</b> ${c.issue} <button class="link" data-open-case="${c.id}">Inspect</button></div>`).join('') || 'No unassigned cases'}</div><div class="card"><h4>Doctor Assignment Panel</h4>${state.doctors.map((d)=>`<div class="rowline"><b>${d.name}</b> <span class="chip">${d.onlineStatus}</span> <span class="chip">Load ${d.performance.assigned}</span> <span class="chip">Spec ${d.specialties[0]}</span>${unassigned[0] ? `<button class="btn" data-case-id="${unassigned[0].id}" data-assign-doctor="${d.id}">Assign ${unassigned[0].id}</button>`:''}</div>`).join('')}</div></div>`;
}

function managerCaseDetail() {
  const c = selectedCase() || state.cases[0];
  return `<div class="card"><h4>Case Detail ${c.id}</h4><div class="tabs-mini"><span class="chip">Overview</span><span class="chip">Timeline</span><span class="chip">Consult History</span><span class="chip">Analytics</span><span class="chip">Attachments</span><span class="chip">Prescriptions</span><span class="chip">Notes</span><span class="chip">Assignment History</span><span class="chip">SLA/Ops</span></div>${casePreview(c,true)}</div>`;
}

function doctorOperations() {
  return `<div class="card"><h4>Doctor Operations View</h4><table><tr><th>Name</th><th>Status</th><th>Load</th><th>TAT</th><th>Closure</th><th>Payout</th><th>Profile</th><th>Action</th></tr>${state.doctors.map((d)=>`<tr><td>${d.name}</td><td>${d.onlineStatus}</td><td>${d.performance.assigned}</td><td>${d.performance.avgTatMins}m</td><td>${d.performance.closureRate}%</td><td>₹${d.payoutRate}</td><td>${d.profileCompletion}%</td><td><button class="btn" data-admin-edit-doctor="${d.id}">Edit</button></td></tr>`).join('')}</table></div>`;
}

function payoutsPage() {
  return `<div class="card"><h4>Payout Ledger (Appointment Snapshot)</h4><table><tr><th>Appointment</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Fee Snapshot</th><th>Payout Snapshot</th><th>Rule</th><th>Adjustment</th><th>Final</th><th>Status</th><th>Actions</th></tr>${state.appointments.map((a)=>{const p=state.patients.find(x=>x.id===a.patientId);const d=state.doctors.find(x=>x.id===a.doctorId);return `<tr><td>${a.id}</td><td>${p?.name||''}</td><td>${d?.name||''}</td><td>${a.consultDate}</td><td>₹${a.consultFeeSnapshot}</td><td>₹${a.payoutSnapshot}</td><td>${a.pricingRuleSnapshot}</td><td>₹${a.adjustment}</td><td>₹${a.finalPayable}</td><td>${a.settlementStatus}</td><td><button class="btn" data-edit-payout="${a.id}">Adj</button><button class="btn" data-toggle-settlement="${a.id}">Toggle</button></td></tr>`;}).join('')}</table><p class="muted">Historical appointments keep fee/payout snapshots even if doctor pricing changes later.</p></div>`;
}

function analyticsDashboard() {
  return `<div class="grid-2"><div class="card"><h4>Consult Volume Trends</h4><p>Weekly trend placeholder chart</p><div class="chips">${chip('Repeat consult rate: 28%')}${chip('Avg duration: 12m')}${chip('Specialty demand: Pediatrics ↑')}</div></div><div class="card"><h4>Productivity Insights</h4><p>Doctor productivity, payout liability, account insights placeholders.</p></div></div>`;
}

function adminDashboard() {
  return `<div class="kpis">${kpi('Active Doctors', seedAnalytics.adminDashboard.activeDoctors)}${kpi('Profile Risks', seedAnalytics.adminDashboard.profileCompletionRisk)}${kpi('Payout Alerts', seedAnalytics.adminDashboard.payoutAlerts)}${kpi('Pending Tasks', seedAnalytics.adminDashboard.pendingTasks)}</div><div class="card">Recent config changes and admin tasks placeholder.</div>`;
}

function doctorMaster() {
  return `<div class="grid-2"><div class="card"><h4>Doctor Master</h4><table><tr><th>Doctor</th><th>Status</th><th>Completion</th><th>Fee</th><th>Payout</th><th>Action</th></tr>${state.doctors.map((d)=>`<tr><td>${d.name}</td><td>${d.onlineStatus}</td><td>${d.profileCompletion}%</td><td>₹${d.consultFee}</td><td>₹${d.payoutRate}</td><td><button class="btn" data-admin-edit-doctor="${d.id}">Edit</button></td></tr>`).join('')}</table></div><div class="card"><h4>Create Doctor (Demo)</h4><form id="create-doctor-form" class="stack"><input id="new-doc-name" placeholder="Name" required/><input id="new-doc-email" placeholder="Email" required/><input id="new-doc-pass" placeholder="Password" required/><input id="new-doc-spec" placeholder="Specialty"/><input id="new-doc-fee" placeholder="Consult Fee"/><input id="new-doc-payout" placeholder="Payout"/><button class="btn primary">Create</button></form></div></div>`;
}

function patientSummary(p, c) {
  return `<p><b>${p.name}</b> (${p.age}/${p.gender})</p><p>Issue: ${c.issue}</p><p>Flags: ${(p.chronicFlags||[]).join(', ')}</p><p>Vitals: ${Object.entries(p.recentVitals||{}).map(([k,v])=>`${k}:${v}`).join(' | ')}</p><p>Prev Dx: ${(p.previousDiagnoses||[]).join(', ')}</p><p>Analytics: ${c.customerInsights}</p>`;
}

function casePreview(c, full = false) {
  const p = state.patients.find((x) => x.id === c.patientId);
  const attachments = c.attachments.map((a)=>`<div class="rowline">${a.name}<button class="btn" data-case-id="${c.id}" data-attachment-id="${a.id}" data-preview-attachment="1">Preview</button><a href="${a.url}" download="${a.name}">Download</a></div>`).join('');
  const rxs = c.prescriptionIds.map((id)=>`<button class="btn" data-preview-prescription="${id}">${id}</button>`).join(' ');
  return `<p><b>${p?.name}</b> • ${c.issue}</p><div class="chips">${chip(c.priority)}${chip(c.queueType)}${chip(c.status)}${chip(`SLA:${c.slaRisk}`)}${chip(`Prev:${c.previousConsults}`)}</div><h5>Patient Analytics</h5><p>${c.customerInsights}</p><h5>Attachments</h5>${attachments || '<p>No attachments</p>'}<h5>Prescriptions</h5>${rxs || '<p>None</p>'}${full ? `<h5>Timeline</h5>${(c.timeline||[]).map((t)=>`<div class="rowline">${t.time} - ${t.event}</div>`).join('')}<h5>Assignment History</h5>${(c.assignmentHistory||[]).map((a)=>`<div class="rowline">${a.time} - ${a.action} by ${a.actor}</div>`).join('')}<h5>Ops History</h5>${(c.opsHistory||[]).map((o)=>`<div class="rowline">${o.time} - ${o.status} (${o.remarks})</div>`).join('')}`:''}`;
}

function prescriptionForm(c) {
  const existing = state.prescriptions.find((r) => r.caseId === c.id) || {};
  return `<form id="prescription-form" class="stack"><input id="rx-cc" placeholder="Chief complaints" value="${existing.chiefComplaints || ''}"/><input id="rx-dx" placeholder="Diagnosis" value="${existing.diagnosis || ''}"/><input id="rx-advice" placeholder="Advice" value="${existing.advice || ''}"/><input id="rx-investigation" placeholder="Investigations" value="${existing.investigations || ''}"/><input id="rx-med" placeholder="Medicine"/><input id="rx-dose" placeholder="Dose"/><input id="rx-freq" placeholder="Frequency"/><input id="rx-dur" placeholder="Duration(days)"/><input id="rx-remark" placeholder="Remark"/><input id="rx-followup" type="date" value="${existing.followUp || ''}"/><label><input id="rx-final" type="checkbox" ${existing.state==='final'?'checked':''}/> Mark Final</label><button class="btn primary">Save Prescription</button></form>`;
}

function queueRow(c, bucket) {
  const p = state.patients.find((x) => x.id === c.patientId);
  return `<div class="rowline"><b>${p?.name || 'Patient'}</b> (${p?.age||''}/${p?.gender||''}) • ${c.issue} • wait ${c.waitingMins}m • ${bucket}<span class="chip">att:${c.attachments.length}</span><span class="chip">analytics:${c.analyticsAvailable?'yes':'no'}</span><button class="link" data-open-case="${c.id}">Open</button></div>`;
}

function kpi(label, value) { return `<div class="kpi"><small>${label}</small><h3>${value}</h3></div>`; }
function chip(v) { return `<span class="chip">${v}</span>`; }
function quick(text, nav) { return `<button class="btn" data-nav="${nav}">${text}</button>`; }

function openDrawer(type, html) {
  $('#drawer').classList.remove('hidden');
  $('#drawer').innerHTML = `<div class="drawer-head"><h4>${type} preview</h4><button class="btn" id="drawer-close">Close</button></div><div>${html}</div>`;
}

function closeDrawer() {
  $('#drawer').classList.add('hidden');
  $('#drawer').innerHTML = '';
}

function selectedCase() {
  return state.cases.find((c) => c.id === state.selectedCaseId) || null;
}

function currentDoctor() {
  return state.doctors.find((d) => d.id === state.user?.id) || state.doctors[0];
}

function load() {
  const raw = localStorage.getItem(STORAGE);
  if (raw) return JSON.parse(raw);
  return {
    role: null,
    loginRole: 'doctor',
    user: null,
    page: null,
    selectedCaseId: seedCases[0].id,
    doctors: structuredClone(seedDoctors),
    managers: structuredClone(seedManagers),
    admins: structuredClone(seedAdmins),
    patients: structuredClone(seedPatients),
    cases: structuredClone(seedCases),
    appointments: structuredClone(seedAppointments),
    prescriptions: structuredClone(seedPrescriptions)
  };
}

function persist() {
  localStorage.setItem(STORAGE, JSON.stringify(state));
}
