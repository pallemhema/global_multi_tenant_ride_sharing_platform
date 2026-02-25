# Frontend – React Ride‑Sharing Application

This directory contains a React single‑page application that interacts with the FastAPI backend via REST endpoints and JWT authentication. It implements all UI flows for riders, drivers, fleet owners, tenant admins, and platform admins.

## Key points

- **State**: Managed through React Context (UserAuthContext, DriverContext, etc.).
- **Routing**: React Router with role‑based guards ensures users only access permitted pages.
- **API services**: Centralised in `services/*Api.js` modules; axios interceptors attach JWT tokens.
- **Polling & heartbeats**: `useTripPoller` (3 s) and `useHeartbeat` (25 s) hooks drive real‑time updates.

## Folder overview

```
client/src/
├─ app/           # entry point and router
├─ pages/         # full‑page components per role/workflow
├─ components/    # reusable UI pieces (buttons, modals, maps)
├─ context/       # global state providers
├─ guards/        # route protection components
├─ layouts/       # layout wrappers by role
├─ hooks/         # custom hooks (polling, heartbeat)
├─ services/      # HTTP call implementations
├─ utils/         # helpers (tokens, location, etc.)
└─ styles/        # global CSS (Tailwind)
```

Refer to the original README for a detailed directory listing if needed.

## Running locally

```bash
cd client
npm install
npm run dev      # starts Vite at http://localhost:3000
```

Open the browser after the backend is running at port 8000.

## Tips

- Keep API calls out of components; update context instead.
- Use the provided hooks for polling rather than ad‑hoc intervals.
- Store tokens using `services/axios.js` helpers to maintain consistency.

---
For full system context see the top‑level README (`../README.md`).
