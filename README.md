# PathGuard

PathGuard is a front-end demo of a safe-journey tracker. A traveller starts a journey, chosen guardians can follow progress on a map, and the app raises calm, escalating alerts if something looks unusual along the route.

Journeys use your **real device location** (browser Geolocation API): progress, distance left, ETA and alerts (no movement for 5 min, heading away from the destination, running late, location lost) are computed from real GPS fixes, and arriving within ~75 m of the destination closes the journey with a "reached safely" notification. Accounts start empty; nothing is pre-filled. The marketing landing page's "live demo" animation is the only simulated part. To test without travelling, use Chrome DevTools → Sensors → Location to override your position.

## Tech stack

- [React 18](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/) for dev/build tooling
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (components in `src/components/ui`, including the sidebar)
- [react-hook-form](https://react-hook-form.com/) + [zod](https://zod.dev/) for form validation (`src/lib/validation.js`)
- [sonner](https://sonner.emilkowal.ski/) for toasts
- [Framer Motion](https://www.framer.com/motion/) for animation
- [Leaflet](https://leafletjs.com/) / [React Leaflet](https://react-leaflet.js.org/) for maps
- [Recharts](https://recharts.org/) for charts
- [Biome](https://biomejs.dev/) for linting and formatting

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000` (fixed port). Use `npm run dev:all` to also start the notification server (email/SMS/WhatsApp) on port 8787.

## Scripts

| Script            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server                                |
| `npm run build`   | Build for production into `dist/`                        |
| `npm run preview` | Preview the production build locally                     |
| `npm run lint`    | Lint the codebase with Biome                             |
| `npm run format`  | Format the codebase with Biome                           |
| `npm run check`   | Run Biome's lint + format + import checks, with auto-fix |

## Project structure

```
src/
  components/   Shared UI building blocks (buttons, map view, error boundary, ...)
  context/      App-wide state (AppContext)
  data/         Mock/demo data (route, places, etc.)
  hooks/        Custom hooks (geolocation, journey state)
  pages/        Route-level pages (Dashboard, Active Journey, Guardian View, ...)
  services/     Browser-facing services (notifications)
  styles/       Global Tailwind styles
public/         Static assets, PWA manifest and service worker
```

## Email (Nodemailer, free)

`server/index.js` is a small Express + [Nodemailer](https://nodemailer.com/) server. Guardians who have an email are emailed when a journey starts, when an alert escalates (or SOS), and when you arrive safely.

```bash
cp .env.example .env     # add a Gmail address + App Password (free), or any SMTP login
npm run dev:all          # starts the mail server (port 8787) and Vite together
```

With no `SMTP_*` set it uses a throwaway Ethereal test inbox: nothing is delivered, and the Settings → "Send me a test email" button shows a preview link. Message text is built on the server from a few validated fields and the endpoint is rate limited, so it cannot be used to send arbitrary mail.

## How sharing works today

Accounts, guardians, journeys and alerts live in the browser (`localStorage`). When a journey starts, PathGuard builds a live link and offers WhatsApp / SMS / email buttons per guardian. The link's live view (`/share/:token`) reads a snapshot from the same browser, so it updates across tabs of one browser only. Delivering location and "reached safely" to a guardian's own phone automatically needs a backend (realtime channel plus push/SMS, e.g. Supabase/Firebase and Twilio) — that is the next step.

## Notes for contributors

- This is a demo/prototype — journeys, alerts and routes are generated from mock data in `src/data/mock.js`, not a real backend.
- Run `npm run check` before committing to keep formatting and lint rules consistent.
# Pathguard-tracker
