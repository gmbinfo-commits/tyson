# Teleconsult V1 (Expanded Prototype)

This prototype now includes the missing Teleconsult platform details you asked for:

- **Doctor creation (onboarding)** with specialty, experience, and consultation fee
- **Doctor login/logout** with basic credential validation
- **Doctor profile management** (about, languages, qualifications)
- **Doctor slot availability management** (date/start/end slot creation)
- **Consultation queue** with lifecycle transitions (Upcoming → In Progress → Completed / No Show)
- **Structured prescription builder** (medicine, dose, frequency, duration)
- **Manager dashboard** with aggregate metrics and doctor roster snapshot

## Run locally

```bash
npm start
```

Open `http://localhost:4173`.

## Tests

```bash
npm test
```

Tests cover appointment state transitions, doctor onboarding/login/profile/availability, prescription formatting, and manager metrics.
