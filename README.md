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
# Teleconsult V1 (Improved Prototype)

This version extends the demo with key flows requested from your existing portal patterns:

- Doctor login + create-doctor onboarding
- **Separate manager login** and manager workspace
- Queue split by **scheduled** and **instant** cases
- Start consultation flow with **Audio / Video** call choice
- Instant case pickup workflow for doctors
- In-consult **chat room** and uploaded report visibility
- Consultation form with prescription builder + completion
- Doctor dashboard with performance KPIs and prescription insights
- Mobile-friendly responsive layout (works like app-style web shell)

## Demo logins

- Doctor: `neha@teleconsult.com` / `demo123`
- Manager: `manager@teleconsult.com` / `manager123`

## Run

```bash
npm start
```

Open `http://localhost:4173`.
Open: `http://localhost:4173`

## Test

```bash
npm test
```
