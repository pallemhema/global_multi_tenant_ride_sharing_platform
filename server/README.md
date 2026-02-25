# Backend – FastAPI Ride‑Sharing Service

The backend exposes a REST API that the React frontend uses for all business operations. It is written with FastAPI and organized into API routes, business services, and data models. PostgreSQL is the primary datastore; Redis is used for caching and driver locations.

## Highlights

- **Three‑layer design**: routes → services (business logic) → models (SQLAlchemy).
- **JWT auth** with role‑based authorization (rider, driver, fleet owner, tenant admin, platform admin).
- **Trip lifecycle** managed as a state machine with strict transitions.
- **Financial system** uses wallets and an append‑only ledger for every balance change.
- **Polling‑safe endpoints** for status checks and heartbeats; read‑only and indexed.

## Directory layout

```
server/app/
├─ api/v1/        # HTTP route definitions
├─ core/          # config, db, dependencies, redis clients
├─ accounting/    # payments, wallets, ledger
├─ fare/          # fare calculation logic
├─ onboarding/    # registration flows
├─ trips/         # trip workflow and status handling
├─ security/      # authentication and tokens
├─ models/        # SQLAlchemy models (users, trips, payments, etc.)
├─ schemas/       # Pydantic request/response shapes
└─ uploads/       # file storage paths
```


## Local development

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # set DATABASE_URL, JWT_SECRET, etc.
alembic upgrade head      # apply schema
uvicorn app.main:app --reload
```

Interact with the API via `http://localhost:8000/docs` after startup.

## Configuration

Environment variables drive behavior; avoid committing secrets. Key vars include:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- CORS origins, mail server credentials, payment gateway keys.

## Best practices

- Add indexes on frequently queried columns to support polling.
- Validate all state transitions and enums to prevent inconsistent trips.
- Use transactions and row locks to avoid race conditions in payments.
- Never log sensitive data such as passwords or tokens.

---
Refer to the top‑level README for an architectural overview of the entire project.
