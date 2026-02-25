# Ride-Sharing Platform

A full‑stack ride‑sharing application supporting multiple user roles (riders, drivers, fleet owners, tenant admins, and platform admins). The system consists of a React frontend and a FastAPI backend; PostgreSQL stores data and Redis is used for caching and location data.

## Repository Structure

- `client/` – React single‑page application. All UI logic, state management, and API services live here.
- `server/` – FastAPI backend. Contains HTTP routes, business logic, database models, and migrations.

Detailed documentation is maintained in the sub‑directory READMEs.

## Quick start

1. **Prerequisites**: Node.js, Python 3.8+, PostgreSQL, optional Redis.
2. **Backend setup**:
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env      # configure DATABASE_URL, JWT_SECRET, etc.
   alembic upgrade head      # run migrations
   uvicorn app.main:app --reload
   ```
3. **Frontend setup**:
   ```bash
   cd client
   npm install
   npm run dev               # starts Vite on http://localhost:3000
   ```
4. Open `http://localhost:3000` in your browser and log in with a test account.

## Core concepts

- **Authentication**: JWT tokens issued by backend and stored in localStorage; axios interceptors apply tokens to requests.
- **Polling**: Regular client‑side polling (3 s for trip status, 25 s for driver heartbeat) keeps the UI in sync with backend state.
- **Roles & Guards**: React Router guards prevent unauthorized access; contexts hold role‑specific state.
- **State Management**: Global state uses React Context; custom hooks encapsulate recurring behaviour.

## License

Specify project license here.

---

For frontend details see `client/README.md`. For backend details see `server/README.md`.
