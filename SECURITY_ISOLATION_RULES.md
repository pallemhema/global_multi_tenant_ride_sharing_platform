# 🔐 SECURITY & ISOLATION RULES - QUICK REFERENCE

## GOLDEN RULE: OWNERSHIP MATTERS

Every single endpoint must validate ownership. If a user shouldn't see/access it, block it.

---

## 🏠 DRIVER OWNERSHIP

### Rule: A trip is visible to driver ONLY if:

```python
trip.driver_id === authenticated_driver.driver_id
```

### Endpoints Enforcing This:

1. **GET /api/v1/driver/trip/active**
   - Returns: `None` if no matching trip
   - Never: Returns another driver's trip

2. **POST /api/v1/driver/trips/respond/{trip_request_id}/{batch_id}**
   - Validates: Authenticated driver ID from token
   - Database: All queries filter by driver_id

3. **GET /api/v1/driver/trip-requests**
   - Only: Pending trips for this driver
   - Filter: `response_code IS NULL AND driver_id = :driver_id`

### Trip Request Candidate States:

```
pending      (response_code = NULL)         → Visible to driver
accepted     (response_code = "accepted")   → NOT visible
rejected     (response_code = "rejected")   → NOT visible
expired      (response_code = "expired")    → NOT visible
```

---

## 👤 RIDER OWNERSHIP

### Rule: A trip is visible to rider ONLY if:

```python
trip_request.user_id === authenticated_rider.user_id
```

### Endpoints Enforcing This:

1. **GET /api/v1/rider/trips/request/{trip_request_id}/status**
   - Validates: `TripRequest.user_id === rider.user_id`
   - Returns: 404 if mismatch

2. **GET /api/v1/rider/trips/trip/{trip_id}/status**
   - Validates: Join TripRequest and check `user_id`
   - Returns: 404 if mismatch or no relationship

3. **POST /api/v1/rider/trips/request** (creation)
   - Sets: `user_id = authenticated_rider.user_id` (server-side)
   - Never: Accepts `user_id` from request body

---

## 🔄 TRIP REQUEST LIFECYCLE - STATE MACHINE

```
┌─────────────┐
│   searching │ ← Initial state when rider creates trip
└────┬────────┘
     │ Multiple drivers receive offer
     │ (batch dispatch starts)
     │
     ▼
┌──────────────────┐
│ driver_searching │ ← Batch 1, Batch 2, etc. are active
│                  │   Drivers can accept/reject
└────┬─────────────┘
     │
     ├─ ACCEPT (Driver A)
     │  └─ Becomes: driver_assigned
     │             Candidate.response_code = "accepted"
     │             Other candidates = "expired"
     │
     └─ All reject
        └─ Stays: driver_searching
           (Next batch triggered if available)
```

### Isolation Rule:

- **Only ONE driver can change status to "driver_assigned"**
- Race condition prevented by SQL `with_for_update()` lock
- If another driver already accepted, return **409 Conflict**

---

## 🛡️ RACE CONDITION PROTECTION

### The Problem:

Driver A and Driver B both click Accept simultaneously.
Both might pass the initial check (`status == "driver_searching"`).

### The Solution - Database Transaction:

```python
# STEP 1: Lock the row
trip_req = db.query(TripRequest)
    .filter(TripRequest.trip_request_id == trip_request_id)
    .with_for_update()  # ← 🔒 LOCK
    .first()

# STEP 2: Check status (within lock)
if trip_req.status != "driver_searching":
    raise HTTPException(409)  # Another driver won

# STEP 3: Change status + create trip + generate OTP
# All in ONE transaction

# STEP 4: Commit everything together
db.commit()  # ← Lock released here
```

### Timeline:

```
Time→
A: Lock row ─────────── Check ─ Change ─ Commit ──→ SUCCESS
B:               Lock (blocked) .... waiting .... Get 409

Result:
✅ A's trip is accepted
❌ B sees "already assigned"
```

---

## 📱 ERROR CODES & MESSAGES

### 409 CONFLICT (Race Condition)

```
Status: 409
Detail: "This trip was accepted by another driver"
Action:
  1. Show error to driver
  2. Immediately remove trip from list
  3. Refresh trip requests
```

### 404 NOT FOUND (Ownership Violation)

```
Status: 404
Detail: "Trip not found" or similar
Cause:
  - Wrong ownership
  - User not authenticated
  - Trip doesn't exist
Action:
  1. Do NOT show custom error (security)
  2. Log for investigation
  3. Redirect to dashboard
```

### 403 FORBIDDEN (Permission Denied)

```
Status: 403
Detail: "Not authorized" or similar
Cause:
  - Driver trying to start another driver's trip
  - Rider trying to access another rider's trip
Action:
  1. Block the request
  2. Log the attempt (suspicious)
  3. Return generic error
```

---

## 🔍 VERIFICATION CHECKLIST FOR EACH ENDPOINT

Before deploying, verify:

### For Driver Endpoints:

- [ ] Accepts `require_driver` dependency
- [ ] Queries filter by `driver.driver_id`
- [ ] Does NOT accept `driver_id` from request body
- [ ] Returns `None` or `404` if no matching record
- [ ] Does NOT reveal another driver's data

### For Rider Endpoints:

- [ ] Accepts `require_rider` dependency
- [ ] Queries filter by `rider.user_id`
- [ ] Joins with TripRequest to verify ownership
- [ ] Does NOT accept `user_id` from request body
- [ ] Returns `None` or `404` if no matching record
- [ ] Does NOT reveal another rider's data

### For Trip Endpoints:

- [ ] Validates trip belongs to authenticated user
- [ ] Uses transaction for multi-step operations
- [ ] Locks resources when updating status
- [ ] Atomically updates all related records
- [ ] Returns specific error codes, not generic 500

---

## 🚫 ANTI-PATTERNS TO AVOID

### ❌ WRONG: Trust frontend to filter

```javascript
// BAD: Frontend removes trip from list but server still allows accept
const acceptedTrips = state.trips.filter((t) => t.status != "accepted");
```

**Why**: User could manipulate frontend, send request anyway.

### ❌ CORRECT: Filter on server

```python
# GOOD: Server only returns pending trips
candidates = db.query(TripDispatchCandidate).filter(
    TripDispatchCandidate.response_code.is_(None)
).all()
```

### ❌ WRONG: Check then update (two transactions)

```python
# BAD: Race condition window between check and update
if trip_req.status == "driver_searching":
    db.commit()
    # Another driver could accept here!
    trip_req.status = "driver_assigned"
    db.commit()
```

### ✅ CORRECT: Atomic check and update

```python
# GOOD: All in one transaction with lock
trip_req = db.query(TripRequest).with_for_update().first()
if trip_req.status == "driver_searching":
    trip_req.status = "driver_assigned"
    # Also create trip, generate OTP, etc.
db.commit()  # All or nothing
```

### ❌ WRONG: Accept user input for ownership

```python
# BAD: Accept driver_id from request
@router.get("/trips/{driver_id}/active")
def get_active_trip(driver_id: int, driver = Depends(require_driver)):
    trip = db.query(Trip).filter(Trip.driver_id == driver_id).first()
    # User could pass another driver's ID!
```

### ✅ CORRECT: Use authenticated user

```python
# GOOD: Use authenticated driver from token
@router.get("/trips/active")
def get_active_trip(driver = Depends(require_driver)):
    trip = db.query(Trip).filter(Trip.driver_id == driver.driver_id).first()
```

---

## 📊 TRUST BOUNDARIES

```
┌─────────────────────────────────────────────┐
│         UNTRUSTED (Frontend)                │
│  • User input                               │
│  • Local storage                            │
│  • Session variables                        │
│  • Anything in browser                      │
└────────────────┬────────────────────────────┘
                 │ HTTP Request
                 ▼
┌─────────────────────────────────────────────┐
│         TRUSTED (Backend)                   │
│  • Authenticated user from JWT token        │
│  • Database queries                         │
│  • Server-side transactions                 │
│  • Environment variables                    │
└─────────────────────────────────────────────┘
```

**Rule**: Never trust data from the browser. Always validate in the backend.

---

## 🧪 TESTING OWNERSHIP RULES

### Test 1: Can Driver B see Driver A's trip?

```python
# Login as Driver B
response = client.get(f"/api/v1/driver/trip/active",
                     headers={"Authorization": "Bearer driver_b_token"})
# Expected: Should return None if Driver A has the active trip
# NOT: Should not return Driver A's trip details
assert response.json()["active_trip"] is None
```

### Test 2: Can Rider B see Rider A's trip request?

```python
# Login as Rider B
response = client.get(f"/api/v1/rider/trips/request/{rider_a_trip_id}/status",
                     headers={"Authorization": "Bearer rider_b_token"})
# Expected: 404 Not Found
assert response.status_code == 404
```

### Test 3: Race condition is prevented

```python
# Simulate two simultaneous accepts
task_a = asyncio.create_task(driver_a_accept(trip_request_id))
task_b = asyncio.create_task(driver_b_accept(trip_request_id))

results = asyncio.gather(task_a, task_b)
# Expected: One succeeds (200), one fails (409)
assert any(r.status_code == 200 for r in results)
assert any(r.status_code == 409 for r in results)
```

---

## 🎯 SUMMARY

| Principle     | Implementation             | Enforcement                   |
| ------------- | -------------------------- | ----------------------------- |
| Ownership     | user_id/driver_id in query | SQL WHERE clause              |
| Atomicity     | Single transaction         | db.with_for_update() + commit |
| Race Safety   | Lock before check          | SQL Row Lock                  |
| Error Clarity | Specific status codes      | 409 vs 404 vs 403             |
| No Trusts     | Validate all input         | Server-side checks only       |
| Quick Fail    | Check early                | Return immediately            |

**Remember**: Security is not optional. Every endpoint matters.
