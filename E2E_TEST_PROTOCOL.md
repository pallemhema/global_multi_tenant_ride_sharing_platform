# 🧪 E2E TEST PROTOCOL - RACE SAFE TRIP LIFECYCLE

## 🎯 OBJECTIVES

Validate:

1. ✅ Multiple drivers receive the same trip
2. ✅ Only ONE driver can accept
3. ✅ Other drivers get clear "accepted by another driver" message
4. ✅ Trip disappears from other drivers' lists
5. ✅ OTP reaches the rider
6. ✅ Only accepting driver can see activeTrip
7. ✅ Rider profile UI is fully visible
8. ✅ No console errors on frontend
9. ✅ No backend log errors

---

## 🚀 TEST FLOW

### PHASE 1: SETUP (Complete before testing)

- [x] Backend running on http://localhost:8000
- [x] Frontend running on http://localhost:3000
- [x] Database seeded with test data
- [x] Both drivers online with vehicles ready

### PHASE 2: DRIVER POOL TEST

**Verify multiple drivers see the same trip**

Action:

1. Open browser 1: Driver A login → Dashboard
2. Open browser 2: Driver B login → Dashboard
3. Both should see the same "Trip Requests" list

Expected:

- Both drivers have identical trip request list
- trip_request_id matches

### PHASE 3: RACE CONDITION TEST

**Verify only one driver can accept, others get proper error**

Action:

1. Driver A clicks ACCEPT (just before Driver B)
2. Driver B clicks ACCEPT simultaneously (or immediately after)

Expected Driver A:

- ✅ Success message: "Trip accepted successfully!"
- ✅ Moves to activeTrip view
- ✅ OTP displayed
- ✅ Runtime status = "trip_accepted"

Expected Driver B:

- ❌ Error message: "This trip was accepted by another driver"
- ✅ Trip IMMEDIATELY REMOVED from list
- ✅ No activeTrip shown
- ✅ Stays on Trip Requests page

### PHASE 4: OTP DELIVERY TEST

**Verify OTP is sent to rider**

Action:

1. Switch to Rider browser
2. Navigate to Assigned page (if not already there)
3. Observe OTP display

Expected:

- ✅ OTP shown in large text (4 digits)
- ✅ "Share this OTP with your driver" message
- ✅ Driver info displayed (name, vehicle, rating)

### PHASE 5: TRIP START TEST

**Verify driver can start trip with OTP**

Action:

1. Driver A enters OTP on DriverTripControls
2. Clicks "Start Trip"

Expected:

- ✅ Trip status changes to "on_trip"
- ✅ Runtime status = "on_trip"
- ✅ activeTrip updated
- ✅ Rider navigates to "In Progress" page

### PHASE 6: UI VALIDATION TEST

**Verify no overlapping elements**

Action:

1. Rider: Navigate to PickupDrop page
2. Select pickup and drop locations on map
3. Check layout

Expected:

- ✅ Map is fully visible (h-72)
- ✅ Input fields below map (not overlapped)
- ✅ All text readable
- ✅ Button accessible
- ✅ No content hidden behind anything

---

## 🔍 CONSOLE ERROR CHECKS

### Frontend Console (Browser DevTools F12)

Check for:

- ❌ No HTTP 404 errors
- ❌ No "Cannot read property of undefined"
- ❌ No "Failed to fetch"
- ❌ No React errors in Error Boundary

Run:

```javascript
// In DevTools Console
console.log(
  document.querySelectorAll('[class*="error"]').length === 0
    ? "✅ No error classes"
    : "❌ Found error classes",
);
```

### Backend Logs (Terminal)

Check for:

- ❌ No 500 Internal Server Error
- ❌ No "IntegrityError" or "OperationalError"
- ❌ No "AttributeError" or "KeyError"
- ✅ All POST requests return 200 or 201

---

## 📊 TEST MATRIX

| Scenario                        | Expected                    | Status |
| ------------------------------- | --------------------------- | ------ |
| Driver A accepts                | Success                     | ⏳     |
| Driver B accepts (same trip)    | TRIP_ALREADY_ACCEPTED error | ⏳     |
| Trip removed from Driver B list | Immediate removal           | ⏳     |
| Rider sees OTP                  | OTP displayed               | ⏳     |
| Driver A starts trip            | Status changes              | ⏳     |
| Rider profile visible           | No overlap                  | ⏳     |
| No frontend errors              | Console clean               | ⏳     |
| No backend errors               | Logs clean                  | ⏳     |

---

## 🛠️ TROUBLESHOOTING

### If Driver B doesn't see "accepted by another driver":

1. Check `/driver/trip-requests` returns only pending
2. Verify `response_code = "expired"` was set for other candidates
3. Reload Driver B's page - trip should be gone

### If OTP not showing on Rider:

1. Check `/rider/trips/request/{trip_request_id}/status` returns `otp` field
2. Verify `store_trip_otp()` was called in accept endpoint
3. Check Redis: `redis-cli get "trip:otp:{trip_id}"`

### If Driver A can't start trip:

1. Verify OTP matches stored value
2. Check trip status = "assigned"
3. Verify `/driver/trips/{trip_id}/start` endpoint exists

### If UI overlaps:

1. Check MapSelector has fixed h-72
2. Verify input fields are in separate container below map
3. Check no absolute positioning on map container

---

## ✅ FINAL ACCEPTANCE CRITERIA

- [ ] Multiple drivers see same trip request
- [ ] First driver accepts successfully
- [ ] Other drivers immediately see error & trip removed
- [ ] OTP delivered and visible to rider
- [ ] Only accepting driver gets activeTrip
- [ ] Driver can start trip with OTP
- [ ] Rider profile UI is clean (no overlaps)
- [ ] Zero frontend console errors
- [ ] Zero backend log errors
- [ ] All endpoints return proper status codes

**NOT COMPLETE UNTIL ALL CRITERIA ARE MET**
