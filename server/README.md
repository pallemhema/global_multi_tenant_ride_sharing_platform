# Backend Documentation – FastAPI Ride-Sharing Platform

For overall system context and cross-service understanding, refer to the main project README.

---

## 📋 Table of Contents

1. Architecture Overview  
2. Folder Structure and Responsibilities  
3. Authentication and Authorization  
4. Trip Lifecycle Management  
5. Wallet, Payments, and Ledger System  
6. Database Design Concepts  
7. Polling Usage and Backend Expectations  
8. Environment Variables and Configuration  
9. Running the Backend Locally  
10. Common Backend Pitfalls and Best Practices  

---

## 🏗️ Architecture Overview

The backend is implemented using FastAPI, a modern Python framework designed for high performance and clarity.

The system follows a strict three-layer architecture:
- The API layer handles HTTP requests, validation, and responses.
- The business logic layer contains all application rules and workflows.
- The data layer manages database models and persistence.

Each layer has a single responsibility, which ensures that changes in one area do not unintentionally affect others.

This structure improves testability, scalability, and long-term maintainability.

---

## 📂 Folder Structure and Responsibilities

The backend codebase is organized by responsibility.

The API layer contains versioned HTTP routes. These routes validate incoming requests, enforce authorization, and delegate work to the business layer.

The core layer contains business logic such as trip lifecycle management, payment processing, fare calculation, authentication services, and ledger recording. This layer does not contain HTTP or database-specific code.

The models layer defines database tables using SQLAlchemy ORM. These files describe relationships, constraints, and persistence rules.

The schemas layer defines request and response validation shapes. This ensures all API inputs and outputs are well-structured and predictable.

The Alembic directory manages database migrations and version control.

The tests directory contains unit and integration tests for critical workflows.

---

## 🔐 Authentication and Authorization

Authentication is based on JSON Web Tokens (JWT).

Users authenticate by providing valid credentials. The backend verifies the credentials, checks account status, and issues a signed JWT token.

The token contains the user identifier, role, and expiration timestamp. It is required for all protected endpoints.

Each request includes the token, which the backend validates before processing. Invalid, expired, or missing tokens result in authorization errors.

Authorization is role-based. Each endpoint checks whether the authenticated user has permission to perform the requested action.

Roles supported by the system include rider, driver, fleet owner, tenant administrator, and platform administrator.

---

## 🚗 Trip Lifecycle Management

The trip lifecycle is the core business workflow of the platform.

Trips move through clearly defined states such as searching, driver assigned, in progress, completed, cancelled, or no drivers available.

State transitions are strictly controlled by backend logic. Invalid transitions are rejected to prevent inconsistent data.

Riders initiate trip requests, drivers progress trips through execution, and the backend enforces state correctness at every step.

Each state transition is recorded and validated to ensure predictable behavior.

---

## 💰 Wallet, Payments, and Ledger System

The financial subsystem is designed to ensure accuracy, traceability, and auditability.

Each user has a wallet that maintains their current balance. Wallet balances are never modified directly.

All balance changes occur through payment workflows and are recorded in a ledger.

Payments represent monetary transactions associated with trips or wallet top-ups. Payments move through states such as pending, confirmed, or failed.

The ledger serves as an immutable audit trail. Every debit and credit is recorded with before-and-after balances, references, timestamps, and descriptions.

This design ensures:
- Full financial traceability
- Easy reconciliation
- Compliance readiness
- Reliable debugging of monetary issues

---

## 🗄️ Database Design Concepts

The database uses PostgreSQL with SQLAlchemy ORM.

Core entities include users, drivers, trip requests, trips, payments, wallets, ledger entries, vehicles, tenants, and lookup tables.

Trip requests and trips are separate entities to clearly distinguish between pre-assignment and active trips.

Driver real-time status and location are stored separately from driver profiles to optimize frequent updates.

Lookup tables store reference data such as trip statuses, vehicle types, and payment methods. This allows configuration changes without code changes.

Ledger entries store both the balance before and after each transaction to ensure financial consistency.

---

## 📡 Polling Usage and Backend Expectations

The backend does not initiate polling. It only responds to client requests.

Certain endpoints are intentionally designed to be safely polled at regular intervals.

Polling endpoints are read-only and must not cause side effects such as state changes, notifications, or financial updates.

Typical polling use cases include:
- Trip request status updates
- Active trip progress
- Payment confirmation status
- Driver heartbeat and location updates

Polling endpoints must be lightweight, indexed, and optimized for frequent access.

---

## ⚙️ Environment Variables and Configuration

The backend is configured using environment variables.

Configuration includes application settings, database connections, Redis settings, JWT secrets, payment gateway credentials, CORS origins, and email service credentials.

Sensitive values such as secrets and passwords must never be committed to version control.

A sample environment file is provided to document required variables.

Production environments must use secure secrets and external configuration management.

---

## 🚀 Running the Backend Locally

To run the backend locally, ensure Python, PostgreSQL, and optionally Redis are installed and running.

Create and activate a Python virtual environment.

Install dependencies using the requirements file.

Configure environment variables using a local environment file.

Run database migrations to create tables.

Start the FastAPI server in development mode.

Once running, the backend exposes interactive API documentation through the built-in documentation interface.

---

## ⚠️ Common Backend Pitfalls and Best Practices

Always add database indexes to frequently queried columns to avoid performance degradation.

Ensure test data is isolated and cleaned up after tests to prevent contamination.

Avoid N+1 query problems by using proper joins and eager loading.

Never store or log plain-text passwords, tokens, or sensitive information.

Protect against race conditions using database transactions and row-level locks.

Validate all enum and status values to prevent invalid states.

Do not assume real-time behavior when using polling; always account for delay.

Handle payment failures explicitly and design for retries and recovery.

Avoid hardcoded configuration values; use environment-based configuration instead.

---

## 📌 Final Notes

Keep API endpoints thin and delegate logic to the business layer.

Ensure business logic remains independent of HTTP and database concerns.

Treat financial operations as critical infrastructure.

Prioritize clarity, safety, and correctness over cleverness.

---

Last Updated: February 2026  
For questions, refer to the main README or contact the project maintainer.
