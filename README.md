# Ride-Sharing Platform - Complete System Overview

Welcome to the ride-sharing platform! This is the main README that explains how everything connects together. **For deep technical details, see the Backend and Frontend READMEs.**

---

## 🎯 What Is This Project?

A full-stack ride-sharing application where:
- **Riders** book trips from point A to point B
- **Drivers** accept trips and complete them
- **Fleet Owners** manage drivers and vehicles
- **Tenant Admins** manage their platform instance
- **Platform Admins** manage all tenants

All with a real-time polling system for trip tracking, payments, and location updates.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Rider Pages  │  │ Driver Pages │  │ Admin Pages     │    │
│  └──────────────┘  └──────────────┘  └─────────────────┘    │
│          ↓              ↓                    ↓              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ State Management: React Context + API Services       │   │
│  │ (UserAuthContext, DriverContext, FleetContext, etc)  │   │
│  └──────────────────────────────────────────────────────┘   │
│          ↓                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ HTTP REST API Calls (axios)                          │   │
│  │ + JWT Bearer Token in Headers                        │   │
│  └──────────────────────────────────────────────────────┘   │
│          ↓                                                  │
└─────────────────────────────────────────────────────────────┘
              ↓ (PORT 3000)
              ↓
┌─────────────────────────────────────────────────────────────┐
│          BACKEND API (FastAPI - Port 8000)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Routes: /api/v1/                                 │   │
│  │ - /auth/* (login, register, tokens)                  │   │
│  │ - /rider/* (trip requests, status, payments)         │   │
│  │ - /driver/* (shifts, status, heartbeat)              │   │
│  │ - /fleet-owner/* (fleet management)                  │   │
│  │ - /tenant-admin/* (platform management)              │   │
│  │ - /admin/* (platform-wide management)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Business Logic Layer (Services)                      │   │
│  │ - TripLifecycle: manages trip state machine          │   │
│  │ - PaymentService: handles payments & wallet          │   │
│  │ - LedgerService: tracks all transactions             │   │
│  │ - AuthService: JWT & role-based access               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                  |
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Database Layer (SQLAlchemy ORM)                      │   │
│  │ Models: Users, Drivers, Trips, Payments, Wallets...  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                  |
└─────────────────────────────────────────────────────────────┘
              ↓
        ┌─────────────────────┐
        │   PostgreSQL DB     │
        │   All data storage  │
        └─────────────────────┘

     SIDE SYSTEMS (not in main flow):
     ┌─────────────┐
     │    Redis    │  ← Used for caching, location tracking
     │  (Port 6379)│
     └─────────────┘
```

---

## 🔄 How Frontend Talks to Backend

### 1. **Authentication Flow**

```
User Enters Credentials → Frontend
        ↓
Frontend: POST /auth/login
Backend: Verifies credentials, creates JWT token
        ↓
Backend: Returns { access_token, token_type, user_role }
        ↓
Frontend: Stores token in localStorage
Frontend: Sets axios interceptor to add token to all requests
        ↓
All Future Requests Include: Header "Authorization: Bearer <token>"
```

### 2. **API Request Pattern**

Every frontend request follows this pattern:

```javascript
// Frontend service (example: tripApi.js)
const getTripStatus = async (tripRequestId) => {
  return apiClient.get(`/rider/trips/request/${tripRequestId}/status`);
};

// axios interceptor automatically adds token:
// Authorization: Bearer eyJhbGc...

// Backend receives request, verifies token
// Backend checks user role & permissions
// Backend returns data or 401/403 error
```

### 3. **Error Handling**

```
Frontend makes request → Backend returns error (400, 401, 403, 500)
        ↓
axios interceptor catches error
        ↓
Frontend displays toast notification (react-toastify)
        ↓
User sees error message
```

---

## 🔁 How Polling Works Across Frontend & Backend

### **Polling is the heartbeat of this app.** Here's how it flows:

#### **Trip Status Polling (3-second interval)**

```
┌────────────── FRONTEND ──────────────┐     ┌──── BACKEND ────┐
│                                      │     │                 │
│ Rider clicks "Book Trip"             │     │                 │
│        ↓                             │     │                 │
│ useTripPoller hook starts            │     │                 │
│        ↓                             │     │                 │
│ setInterval(() => {                 │     │                 │
│   getTripStatus(tripId)              │────→ GET /trips/{id}/status
│ }, 3000)                             │     │                 │
│        ↓                             │     │ Check database:
│ Wait 3 seconds                       │     │ - Trip exists?
│        ↓                             │     │ - Is driver assigned?
│ Send request again (poll #2)         │     │ - What's trip status?
│        ↓                             │     │                 │
│ Wait 3 seconds                       │     │                 │
│        ↓                             │     │                 │
│ Send request again (poll #3)         │     │                 │
│        ↓                             │←──── Return status + data
│ Receive: status = "driver_assigned"  │     │                 │
│        ↓                             │     │                 │
│ IF status changed:                   │     │                 │
│   - Call onStatusChange callback     │     │                 │
│   - Navigate to next page            │     │                 │
│   - Stop polling (unmount component) │     │                 │
│        ↓                             │     │                 │
│ Polling ENDS                         │     │                 │
└────────────────────────────────────┘     └─────────────────┘
```

**Why every 3 seconds?**
- Fast enough: Driver appears within 3 seconds ✓
- Not too fast: Server not overwhelmed ✓
- Mobile friendly: Not draining battery ✓

#### **Driver Location Heartbeat (25-second interval)**

```
┌────────────── FRONTEND ──────────────┐     ┌──── BACKEND ────┐
│                                      │     │                 │
│ Driver goes online                   │     │                 │
│        ↓                             │     │                 │
│ useHeartbeat hook starts             │     │                 │
│        ↓                             │     │                 │
│ Every 25 seconds:                    │     │                 │
│   1. Get GPS location (geo API)      │     │                 │
│   2. POST /driver/location-heartbeat │────→ POST with location
│        ↓                             │     │                 │
│ Wait 25 seconds                      │     │ Update:
│        ↓                             │     │ - driver_current_status.location
│ Get new GPS location                 │     │ - last_seen timestamp
│ POST again                           │     │                 │
│        ↓                             │     │                 │
│ [Repeats every 25 seconds]           │     │                 │
│        ↓                             │     │                 │
│ Driver goes offline                  │     │                 │
│        ↓                             │     │ After 60 sec no heartbeat:
│ useHeartbeat stops                   │     │ - Mark driver offline
│ No more location updates             │←──── │                 │
└────────────────────────────────────┘     └─────────────────┘
```

**Why 25 seconds?**
- Regular enough: Drivers can't pretend to be online when offline ✓
- Not too frequent: Conserves mobile data & battery ✓

---

## 📊 Complete Trip Flow (Frontend ↔ Backend ↔ DB)

This shows how frontend, backend, and database work together for a complete trip:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          STEP 1: RIDER BOOKS TRIP                       │
└─────────────────────────────────────────────────────────────────────────┘

Frontend:
  1. Rider selects pickup & dropoff location
  2. Frontend: POST /rider/trips/request
     Body: { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, tenant_id }

Backend:
  1. TripLifecycle.create_trip_request() validates rider
  2. Creates TripRequest record in DB with status="searching"
  3. Starts matching algorithm: finds nearby drivers
  4. Returns: { trip_request_id, status: "searching" }

Frontend:
  1. Receives tripRequestId
  2. Navigates to Searching page
  3. STARTS POLLING: getTripStatus(tripRequestId) every 3 seconds

Database After Step 1:
  trip_requests table: 1 new row with status="searching"

┌─────────────────────────────────────────────────────────────────────────┐
│           STEP 2: DRIVER ACCEPTS (Backend Matching Service)            │
└─────────────────────────────────────────────────────────────────────────┘

Backend (Matching Service - might be async job):
  1. Finds drivers near pickup location
  2. Checks driver_current_status for each driver
  3. Filters drivers with status="online" and acceptable rating
  4. Updates trip_request.assigned_driver_id = driver_id
  5. Changes status from "searching" → "driver_assigned"
  6. Generates OTP: "1234"
  7. Creates Trip record in trips table
  8. Sets trip_request.trip_id

Frontend (Polling Detects Change):
  1. Poll #1: GET /rider/trips/request/{id}/status
     Response: { status: "searching", driver_info: null }
  2. Poll #2: GET /rider/trips/request/{id}/status
     Response: { status: "driver_assigned", 
                assigned_info: { 
                  driver_name: "John", 
                  vehicle_number: "ABC123",
                  otp: "1234"
                } 
              }
  3. Detects status changed → onStatusChange callback fires
  4. Navigates to Assigned page
  5. STOPS polling on Searching page, STARTS polling on Assigned page

Database After Step 2:
  trip_requests: updated status="driver_assigned", otp added
  trips: 1 new record created
  driver_current_status: driver marked as assigned (if not on trip already)

┌─────────────────────────────────────────────────────────────────────────┐
│               STEP 3: DRIVER SHARES OTP & STARTS TRIP                  │
└─────────────────────────────────────────────────────────────────────────┘

Frontend (Assigned Page):
  1. Shows driver details
  2. Shows OTP: "1234"
  3. Driver taps "Start Trip" button

Backend:
  1. Receives: POST /trips/{trip_id}/start
  2. Validates OTP if rider provided it
  3. Updates trip.status = "in_progress"
  4. Records trip.start_time = now()
  5. Starts location tracking for driver

Frontend (Polling Assigned Page):
  1. Poll detects status="in_progress"
  2. Navigates to InProgress page with trip_id
  3. STOPS polling Assigned page, STARTS polling InProgress page

Database After Step 3:
  trips: updated status="in_progress", start_time recorded
  trip_request: marked as "in_progress"

┌─────────────────────────────────────────────────────────────────────────┐
│          STEP 4: TRIP IN PROGRESS (Location Tracking)                  │
└─────────────────────────────────────────────────────────────────────────┘

Frontend (InProgress Page) - Polling Every 3 Seconds:
  1. GET /trips/{trip_id}/status
  2. Receives: { 
       status: "in_progress",
       driver_location: { lat: 78.52, lng: 17.39 },
       distance: "7.2 km",
       eta: "12 mins"
     }
  3. Updates map with driver location
  4. Updates ETA display

Backend (Driver Sends Location Every 25 Seconds):
  1. Driver's useHeartbeat sends: POST /driver/location-heartbeat
  2. Backend updates: driver_current_status.location
  3. When trip status polled:
     - Fetches driver's latest location
     - Calculates distance to destination
     - Estimates ETA
     - Returns to frontend

Database During Step 4:
  driver_current_status: location updated every 25 seconds
  (No trip record updates unless trip completed)

┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 5: DRIVER COMPLETES TRIP                       │
└─────────────────────────────────────────────────────────────────────────┘

Backend:
  1. Driver taps "Complete Trip" button
  2. Backend: POST /trips/{trip_id}/complete
  3. Updates trips: status="completed", end_time=now()
  4. Calculates: distance, duration, base_fare
  5. Initiates payment processing
  6. Creates Payment record with status="pending"

Frontend (Polling InProgress Page):
  1. Poll detects status="completed"
  2. Navigates to TripCompletion page with trip_id
  3. STOPS polling InProgress page, STARTS polling TripCompletion page

Database After Step 5:
  trips: updated status="completed", end_time, fare_calculated
  payments: 1 new record with status="pending" (awaiting payment confirmation)

┌─────────────────────────────────────────────────────────────────────────┐
│               STEP 6: PAYMENT PROCESSING & CONFIRMATION                 │
└─────────────────────────────────────────────────────────────────────────┘

Frontend (TripCompletion Page):
  1. Displays: fare, distance, duration
  2. Shows: "Processing payment..."
  3. CONTINUES POLLING: GET /trips/{trip_id}/payment-status
  4. Every 3 seconds checks if payment confirmed

Backend (Payment Service):
  1. Initiates payment with payment gateway
  2. Waits for webhook callback from payment provider
  3. Receives confirmation: "payment_successful"
  4. Updates Payment record: status="confirmed"
  5. Updates Trip: payment_status="paid"
  6. Calls LedgerService to record transactions:
     - Debit rider's wallet: fare amount
     - Credit driver's wallet: (fare - commission)
     - Record platform commission

Frontend (Polling Detects Payment):
  1. Poll receives: { status: "completed", payment_status: "paid" }
  2. Displays: "✓ Payment successful"
  3. Shows receipt with all details
  4. STOPS polling (user is done)

Database After Step 6:
  payments: updated status="confirmed"
  trips: updated payment_status="paid"
  wallet_transactions: 3 new records (rider debit, driver credit, commission)
  ledger_entries: all transactions recorded for accounting
  user_wallets: rider balance decreased, driver balance increased

┌─────────────────────────────────────────────────────────────────────────┐
│                   FINAL STATE: TRIP COMPLETE                           │
└─────────────────────────────────────────────────────────────────────────┘

Database Final State:
  ✓ trip_requests: complete record with all status history
  ✓ trips: complete record with times, fare, distance
  ✓ payments: confirmed payment with all details
  ✓ wallet_transactions: all money movements recorded
  ✓ ledger_entries: complete audit trail
  ✓ driver_current_status: available again for new trips
```

---

## 🚀 How to Run the Full System End-to-End

### **Prerequisites**
```bash
# You need these installed:
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+
```

### **Step 1: Start PostgreSQL**
```bash
# On Windows (if installed as service)
net start postgresql-x64-15

# OR with Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

### **Step 2: Start Redis**
```bash
# On Windows (if installed)
redis-server

# OR with Docker
docker run --name redis -p 6379:6379 -d redis:7
```

### **Step 3: Start Backend**
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file with:
# DATABASE_URL=postgresql://user:password@localhost:5432/ride_share_db
# REDIS_HOST=localhost
# REDIS_PORT=6379
# JWT_SECRET_KEY=your_secret_key_here

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

**Backend should be running at:** `http://localhost:8000`

### **Step 4: Start Frontend**
```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend should be running at:** `http://localhost:5173` (or `http://localhost:3000`)

### **Step 5: Test the Full Flow**

1. Open http://localhost:5173 in browser
2. Sign up as a rider
3. Open second browser (incognito) → sign up as a driver
4. Driver: Go online (accept shift)
5. Rider: Book a trip
6. Watch the polling in action:
   - Open browser DevTools → Network tab
   - You'll see `/status` requests every 3 seconds
   - Status changes when driver accepts
7. Driver: Accept the trip
8. Driver: Start trip with OTP
9. Watch live location updates on rider's map
10. Driver: Complete trip
11. Rider: Confirm payment

---

## 📚 For Deep Technical Details

### **Backend Developers:** See [backend/README.md](backend/README.md)
- Full backend architecture
- Database schema
- API endpoint details
- Payment & ledger system
- Wallet design
- Authentication flow
- Common backend pitfalls

### **Frontend Developers:** See [client/README.md](client/README.md)
- Frontend architecture
- State management with Context
- API integration patterns
- Polling implementation
- Error handling with Toast
- Authentication on frontend
- Common frontend pitfalls

---

## 🔐 Key Architectural Decisions

### **Why Polling Instead of WebSockets?**
- ✅ Trips are short (5-30 min) → No need for persistent connections
- ✅ Simpler backend infrastructure
- ✅ Mobile-friendly (network switches don't break polling)
- ✅ Easier to scale (stateless API)

See [Polling Deep Dive](#polling-design-decision-explained) below.

### **Why Multiple Contexts (UserAuthContext, DriverContext, etc)?**
- ✅ Each role has different data needs
- ✅ Cleaner state management
- ✅ Role-based access control is clear
- ✅ Prevents data leaks between roles

### **Why Redis for Location?**
- ✅ Fast location lookups (no DB query)
- ✅ Automatic expiration (stale data cleaned up)
- ✅ Supports real-time features in future

---

## 🛠️ Common Questions

**Q: Why does the trip page keep polling even after I navigate away?**
A: It shouldn't! The `return () => clearInterval(id)` in useEffect cleanup should stop it. Check that your component properly unmounts when navigating.

**Q: Why can't I see the driver location on the map?**
A: The backend needs the driver's heartbeat to be sent. Check that useHeartbeat is enabled while the driver is on a trip.

**Q: Payment shows "pending" forever?**
A: The payment gateway webhook might not be set up. Check backend logs to see if payment confirmation was received.

**Q: How do I add a new API endpoint?**
A: Add it to `backend/app/api/v1/{feature}/` folder, create the route, add to main router in `__init__.py`, then create the frontend service in `client/src/services/`.

---

## 📞 Getting Help

- **Backend issues?** → Check `backend/README.md` → Search error in backend logs
- **Frontend issues?** → Check `client/README.md` → Open DevTools Network tab to see API calls
- **Database issues?** → Check PostgreSQL logs → Run migrations again
- **Polling not working?** → Check if component is mounted → Open DevTools Network tab → See if requests are being sent

---

**Last Updated:** February 2026  
**Team:** Ride-Sharing Platform Developers
