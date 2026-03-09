# TeleOps Teleconsult MVP Prototype

A role-based teleconsult operations front-end prototype with app-shell UX and queue-first workflows.

## Roles and Demo Logins

- Doctor: `neha@teleconsult.com` / `demo123`
- Manager: `manager@teleconsult.com` / `manager123`
- Admin: `admin@teleconsult.com` / `admin123`

## Major modules

- Doctor: Dashboard, Queue, Active Consult, Case History, Slots, Prescriptions, Profile
- Manager: Live Dashboard, Case Queue, Assignment Console, Case Detail, Doctor Ops, Payout Ledger, Reports
- Admin: Dashboard, Doctor Master (edit controls), Configuration, Audit, Analytics

## Included operational capabilities

- Case-first view with history, analytics cards, timeline, attachments, notes
- Attachment preview and download actions
- Prescription preview and download
- Manager case assignment/reassignment
- Admin doctor edit actions
- Appointment-level payout ledger with fee/payout snapshots and adjustment controls

## Run

```bash
npm start
```

Open `http://localhost:4173`.

## Test

```bash
npm test
```
