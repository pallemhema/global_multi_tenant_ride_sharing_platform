# Frontend Documentation – React Ride-Sharing Platform

For a complete system overview and backend details, refer to the main project README.

---

## 📋 Table of Contents

1. Architecture Overview  
2. Frontend Data Flow  
3. Folder Structure and Responsibilities  
4. State Management Strategy  
5. API Integration Guidelines  
6. Polling and Real-Time Updates  
7. Error Handling Strategy  
8. Authentication and Authorization Flow  
9. Running the Frontend Locally  
10. Common Frontend Pitfalls and Best Practices  

---

## 🏗️ Architecture Overview

The frontend is implemented as a React Single Page Application (SPA).  
It communicates with the backend exclusively through HTTP REST APIs and does not maintain direct database access.

The application follows a layered architecture where UI rendering, state management, and API communication are clearly separated. This design improves maintainability, testability, and scalability.

---

## 🔄 Frontend Data Flow

User interactions originate from page-level components such as login screens, trip flows, and dashboards.  
These components read from and update shared application state managed through React Context.

All network communication is handled through centralized service modules. Backend responses update context state, and React automatically re-renders the UI based on these updates.

This flow ensures predictable behavior and prevents UI components from containing business logic.


```
┌─────────────────────────────────────────────────────────┐
│                   USER INTERFACE                        │
│  (Pages like Searching.jsx, InProgress.jsx, etc)       │
└─────────────────────────────────────────────────────────┘
                    ↑↓ (uses)
┌─────────────────────────────────────────────────────────┐
│              STATE MANAGEMENT (Context)                 │
│  UserAuthContext, DriverContext, TripContext, etc      │
│  (Holds user data, auth tokens, trip state)            │
└─────────────────────────────────────────────────────────┘
                    ↑↓ (calls)
┌─────────────────────────────────────────────────────────┐
│              API SERVICES (tripApi.js, etc)            │
│  - GET /trips/request/{id}/status                      │
│  - POST /trips/{id}/complete                           │
│  - etc                                                  │
└─────────────────────────────────────────────────────────┘
                    ↑↓ (via HTTP)
┌─────────────────────────────────────────────────────────┐
│                  BACKEND API                            │
│  (FastAPI server at http://localhost:8000)             │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Folder Structure and Responsibilities

The frontend source code is organized by responsibility rather than by feature size.

The pages directory contains route-level components that represent entire screens in the application. Each page corresponds to a specific user role or workflow such as rider journeys, driver dashboards, or admin panels.

The components directory contains reusable UI elements such as buttons, cards, modals, loaders, and map displays. These components focus only on presentation and do not contain business logic.

The context directory manages global application state. Each major user role has its own context to ensure isolation of responsibilities and prevent data conflicts.

The services directory contains all backend communication logic. Every API call is centralized here so backend changes do not affect UI components directly.

The guards directory handles route-level access control. It ensures users can only access pages allowed by their authentication state and role.

The layouts directory defines consistent page structures such as headers, sidebars, and navigation for different user roles.

The hooks directory contains reusable behavioral logic such as polling and heartbeat mechanisms.

The utils directory provides helper utilities for token handling, location services, validation logic, and other shared helpers.

client/src/
│
├── main.jsx                         # App entry point
├── app/
│   ├── App.jsx                      # Root component
│   └── router.jsx                   # Route definitions (React Router)
│
├── pages/                           # Full-page components (route destinations)
│   ├── auth/
│   │   ├── AdminLogin.jsx           # Platform admin login
│   │   └── UserLogin.jsx            # Rider/driver/fleet login
│   ├── rider/
│   │   ├── Searching.jsx            # Polls every 3s: is driver assigned?
│   │   ├── Assigned.jsx             # Driver assigned, show OTP
│   │   ├── InProgress.jsx           # Polls: where is driver? ETA?
│   │   ├── TripCompletion.jsx       # Polls: payment confirmed?
│   │   ├── Payment.jsx              # Payment page
│   │   └── ...
│   ├── drivers/
│   │   ├── Dashboard.jsx            # Driver home page
│   │   ├── Shifts.jsx               # Go online/offline
│   │   ├── Profile.jsx              # Edit profile
│   │   └── ...
│   ├── fleets/
│   │   ├── FleetDashboard.jsx       # Fleet owner dashboard
│   │   └── ...
│   ├── tenant-admin/
│   │   ├── Dashboard.jsx            # Tenant admin dashboard
│   │   └── ...
│   └── appAdmin/
│       └── ...
│
├── components/                      # Reusable UI components
│   ├── common/
│   │   ├── Button.jsx               # Generic button
│   │   ├── Card.jsx                 # Card layout
│   │   ├── Modal.jsx                # Modal popup
│   │   ├── Loading.jsx              # Loading spinner
│   │   └── ...
│   ├── layout/
│   │   ├── Header.jsx               # Header/navbar
│   │   ├── Sidebar.jsx              # Side menu
│   │   └── ...
│   ├── auth/
│   │   ├── LoginForm.jsx            # Login form
│   │   ├── RegisterForm.jsx         # Signup form
│   │   └── ...
│   ├── Trip/
│   │   ├── TripCard.jsx             # Display single trip
│   │   ├── TripList.jsx             # List of trips
│   │   └── ...
│   ├── Map/
│   │   ├── MapDisplay.jsx           # Map with locations
│   │   └── ...
│   ├── rider/
│   │   ├── RiderCard.jsx            # Rider info card
│   │   └── ...
│   └── drivers/
│       ├── DriverCard.jsx           # Driver info card
│       └── ...
│
├── context/                         # State management (React Context API)
│   ├── UserAuthContext.jsx          # ✓ For riders
│   ├── DriverContext.jsx            # ✓ For drivers
│   ├── FleetOwnerContext.jsx        # ✓ For fleet owners
│   ├── TenantContext.jsx            # ✓ For tenant admins
│   ├── AdminAuthContext.jsx         # ✓ For platform admins
│   └── VehicleContext.jsx           # ✓ For vehicle data
│
├── guards/                          # Route protection (authorization)
│   ├── RoleRedirect.jsx             # Redirects based on role
│   ├── user/
│   │   ├── RiderRoute.jsx           # Only riders can access
│   │   ├── DriverRoute.jsx          # Only drivers can access
│   │   └── FleetRoute.jsx           # Only fleet owners can access
│   └── admin/
│       └── AdminGuard.jsx           # Only admins can access
│
├── layouts/                         # Page layouts (wrappers)
│   ├── RiderLayout.jsx              # Header + sidebar for riders
│   ├── DriverLayout.jsx             # Header + sidebar for drivers
│   ├── FleetLayout.jsx              # Header + sidebar for fleet owners
│   └── TenantAdminLayout.jsx        # Header + sidebar for tenant admins
│
├── services/                        # API communication (HTTP calls)
│   ├── axios.js                     # ⭐ Axios setup + interceptors
│   ├── userAuthApi.js               # POST /auth/login, /auth/register
│   ├── tripApi.js                   # GET/POST trip endpoints
│   ├── driverApi.js                 # Driver endpoints + heartbeat
│   ├── fleetOwnerApi.js             # Fleet owner endpoints
│   ├── tenantAdminApi.js            # Tenant admin endpoints
│   ├── adminAuthApi.js              # Admin login
│   ├── appAdminApi.js               # Admin management endpoints
│   ├── vehicleApi.js                # Vehicle endpoints
│   └── lookups.js                   # Static data (vehicle types, etc)
│
├── hooks/                           # Custom React hooks
│   ├── useTripPoller.js             # ⭐ Trip status polling (3s interval)
│   └── useHeartbeat.js              # ⭐ Driver location heartbeat (25s interval)
│
├── styles/
│   └── index.css                    # Global styles + Tailwind
│
└── utils/                           # Utility functions
    ├── jwt.js                       # JWT token parsing
    ├── location.js                  # Geolocation API
    ├── reverseGeoCode.js            # Convert coords to address
    ├── passwordChecker.jsx          # Password validation
    ├── TenantCompilance.jsx         # Document validation
    └── tokenStorage.js              # localStorage helpers


### **Key Folder Responsibilities**

| Folder | Responsibility |
|--------|---|
| `pages/` | Full-page components shown by router |
| `components/` | Reusable UI components (buttons, cards, modals) |
| `context/` | State management, shared app-wide state |
| `guards/` | Protect routes from unauthorized access |
| `services/` | API calls to backend |
| `hooks/` | Custom React hooks (polling, heartbeat) |
| `layouts/` | Page wrappers with header/sidebar |
| `utils/` | Helper functions (not components) |



---

## 🧠 State Management Strategy

The application uses React Context API for global state management instead of Redux.

Context is chosen because it provides sufficient flexibility for medium-sized applications while keeping the codebase simple and approachable. It avoids additional dependencies and reduces boilerplate.

Each context serves as a single source of truth for its respective domain. UI components consume context data and never duplicate or independently manage the same state.


---

## 🔗 API Integration Guidelines

All API communication follows a strict and consistent pattern.

A single Axios configuration defines the backend base URL and automatically attaches authentication tokens to every request. Error handling is centralized to ensure consistent behavior across the application.

Each backend endpoint is represented by a dedicated function in a service file. Components never call HTTP clients directly and only interact with these service functions.

This separation allows backend changes to be isolated and reduces the risk of breaking UI logic.

---

## 📡 Polling and Real-Time Updates

Since WebSockets are not used, the frontend relies on polling to stay updated with backend state changes.

Polling is used for scenarios such as driver assignment, trip progress, payment confirmation, and driver location updates.

Polling logic is encapsulated in custom hooks to ensure reuse and proper cleanup. Polling automatically stops when components unmount, preventing unnecessary API calls and memory leaks.

Exponential backoff is used during failures to avoid overwhelming the backend during network instability.

---

## ⚠️ Error Handling Strategy

User-facing errors are communicated through toast notifications.

Only meaningful events trigger notifications, such as failed payments or completed trips. Background requests do not show notifications to avoid overwhelming users.

Authentication errors are handled globally so individual components do not need to implement repetitive logic.

This approach ensures consistent messaging and a better user experience.

---

## 🔐 Authentication and Authorization Flow

Authentication begins with a user login request to the backend.  
Upon success, the backend returns a JWT token, which is securely stored on the client.

All subsequent API requests automatically include this token. Route guards ensure that users can only access pages permitted by their role.

Logout clears all stored authentication data and resets application state. Token expiration and unauthorized access are handled centrally.

---

## 🚀 Running the Frontend Locally

To run the frontend locally, ensure Node.js and npm are installed with supported versions.

Install dependencies using the package manager.  
Start the development server from the frontend directory.

The frontend expects the backend server to be running and accessible at the configured base URL. Without the backend, some features will not function correctly.

Once started, the application can be accessed through the local development URL provided by the build tool.

---

## ⚠️ Common Frontend Pitfalls and Best Practices

Always clean up intervals, timeouts, and asynchronous effects to prevent memory leaks.

Avoid duplicating state across multiple contexts. Maintain a single source of truth for each domain.

Show loading indicators during API requests so users understand that actions are in progress.

Validate user input on the frontend before sending requests to the backend to reduce unnecessary API errors.

Do not hardcode API URLs. Always rely on centralized configuration.

Handle authentication failures globally rather than repeating logic in every component.

Make it clear to users that polling-based data is not real-time.

---

## 📌 Final Notes

Keep UI components simple and free of business logic.  
Reuse existing components and hooks instead of duplicating logic.  
Follow consistent naming conventions across the codebase.  
Treat services and contexts as foundational infrastructure.

---

Last Updated: February 2026  
For questions, refer to the main README or contact the project maintainer.

