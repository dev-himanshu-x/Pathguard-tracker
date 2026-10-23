# PathGuard

PathGuard is a personal safety web app for tracking a journey in real time and keeping chosen guardians in the loop. Start a journey, share a live map link, and let PathGuard notify your guardians by email, SMS, or WhatsApp if you don't check in on time.

## Features

- **Live journey tracking** — share your current location and route on a live map while travelling.
- **Guardians** — add trusted contacts who receive updates and alerts for your journeys.
- **Shareable link** — a `/share/:token` page lets guardians follow a journey without needing an account.
- **Automatic alerts** — if you miss a check-in, PathGuard notifies your guardians so they can check on you.
- **Notifications** — delivered via email (Nodemailer) and SMS/WhatsApp (Twilio).
- **History** — review past journeys and alerts.

## Tech stack

- **Frontend:** React 18, React Router, Vite, Tailwind CSS, Radix UI, Leaflet / React-Leaflet, Recharts
- **Backend:** Express (notification server for email, SMS, and WhatsApp)
- **Tooling:** Biome (lint/format)

## Getting started

### Prerequisites

- Node.js 18 or later
- npm

### Installation

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values you need:

```bash
cp .env.example .env
```

- **Email:** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM`. A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) works well. Leave the `SMTP_*` values empty to use a throwaway Ethereal test inbox — nothing is delivered, but a preview link is returned.
- **SMS / WhatsApp:** set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, and `TWILIO_WHATSAPP_FROM`. A free Twilio trial account works; trial accounts can only message verified numbers, and WhatsApp requires each guardian to join the sandbox first.

### Running locally

Run the frontend and notification server together:

```bash
npm run dev
```

This starts the Express notification server on `http://localhost:8787` and the Vite dev server on `http://localhost:3000` (requests to `/api` are proxied to the notification server).

Or run them separately:

```bash
npm run dev:web   # Vite dev server only
npm run server    # Express notification server only
```

### Build

```bash
npm run build     # production build
npm run preview   # preview the production build
```

### Linting & formatting

```bash
npm run lint      # check for lint errors
npm run format    # format the codebase
npm run check     # lint + format, applying fixes
```

## Project structure

```
server/           Express notification server (email, SMS, WhatsApp)
src/
  components/     Reusable UI components (including shadcn/Radix-based primitives in components/ui)
  context/        App-wide React context
  data/           Static/sample data
  hooks/          Custom React hooks
  lib/            Utility functions
  pages/          Route-level page components
  services/       API/service layer
  styles/         Global styles
```

## License

No license has been specified for this project.
