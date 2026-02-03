# Live Testing Flow - Trip Completion & OTP Visibility

## Scenario: Rider Books Trip, No Drivers Available, Retries with Different Provider, Trip Completes with OTP

### Phase 1: New Trip Request

1. Open browser: http://localhost:3000
2. Login as **Rider** (test@rideshare.com / password)
3. Go to Dashboard → Click "Book a Ride"
4. Set pickup/dropoff locations
5. Submit trip request
6. **Expected**: Backend logs show `[TRIP REQUEST CREATED]`

### Phase 2: Choose Provider (First Attempt)

1. Page shows available tenants/providers
2. Select a provider and vehicle category
3. Click "Proceed"
4. **Expected**:
   - Backend logs show `[TENANT SELECTED]` for that trip_request_id
   - Page navigates to Searching page

### Phase 3: Wait for Drivers (Timeout)

1. System searches for drivers for 8-10 polls (24-30 seconds)
2. **Expected**: After timeout, message appears: "No drivers available right now"
3. See button: "Choose Different Provider"
4. Note down the **trip_request_id** from the URL

### Phase 4: Go Back and Retry (Critical Test)

1. Click "Choose Different Provider" button
2. **Expected in backend logs**:
   - `[TRIP REQUEST CANCEL] trip_request_id={id} cancelled by rider`
3. **Expected**: Redirected back to Dashboard
4. Click "Book a Ride" again
5. **Expected**: Can create a NEW trip request (not the same one)

### Phase 5: Second Attempt with Different Provider

1. Repeat Phase 2 with a DIFFERENT provider/vehicle
2. Click "Proceed"
3. **Expected**: Navigates to Searching page with NEW trip_request_id

### Phase 6: Driver Acceptance (Need to Setup)

**Note**: To test this, you need a second browser with a driver logged in:

1. Open Browser 2: Driver login (driver@test.com / password)
2. Driver should see trip offers
3. Driver clicks "Accept"
4. **Expected in backend logs**:
   - `[OTP STORE]` messages showing OTP generation and storage
   - Hashed OTP stored in Redis
   - Plaintext OTP stored in Redis for dev testing

### Phase 7: Trip Lifecycle

1. **Rider**: See "Trip Assigned" page with driver details
2. **Driver**: See "Driver Accepted - Heading to Pickup"
3. **Rider**: Once driver picks up → "In Progress" page
4. **Driver**: Complete trip with distance/duration
5. **Expected in backend logs**:
   - `[OTP VERIFY]` messages when OTP is verified
   - `[TRIP COMPLETE]` message

### Phase 8: Trip Completion & Receipt (Main Test)

1. **Rider**: Automatically navigated to TripCompletion page
2. **Expected on page**:
   - ✅ "Trip Completed!" header
   - ✅ **OTP** displayed in amber box (if retrieved from Redis)
   - ✅ Pickup and dropoff addresses
   - ✅ Duration and distance
   - ✅ **Fare Breakdown**:
     - Base Fare
     - Distance Charge
     - Time Charge (if any)
     - Surge multiplier (if applicable)
     - Discount (if coupon applied)
     - **Tax**
     - **Payable Amount** (total fare)
   - ✅ "Book Another Ride" button
3. **Expected in backend logs**:
   - `[RECEIPT] Retrieved OTP from Redis for trip_id={id}: {OTP}`
   - All fare calculations logged

### Phase 9: Verify OTP in Payment

1. Note the OTP shown on completion page
2. **Expected**: OTP matches the one from backend logs
3. OTP should be valid for 30 minutes for payment verification

## Success Criteria

| Component                 | Status | Details                                  |
| ------------------------- | ------ | ---------------------------------------- |
| Trip Request Creation     | ✅     | Shows trip_request_id                    |
| Tenant Selection          | ✅     | Changes status to tenant_selected        |
| No Drivers Retry          | ✅     | Shows retry button after 24s             |
| Trip Request Cancellation | ✅     | Can cancel and create new one            |
| OTP Generation            | ✅     | Logged in backend                        |
| OTP Storage (Redis)       | ✅     | Both hashed & plaintext stored           |
| OTP Retrieval             | ✅     | Retrieved from Redis in receipt endpoint |
| OTP Display               | ✅     | Shown to rider on completion page        |
| Fare Calculation          | ✅     | All components displayed                 |
| Payable Amount            | ✅     | Correct total shown                      |

## Backend Log Markers to Watch

```
[TRIP REQUEST CREATED] - Trip request initiated
[TRIP REQUEST CANCEL] - Cancellation logged
[TENANT SELECTED] - Provider/tenant selected
[OTP STORE] - OTP generation and storage
[OTP VERIFY] - OTP verification during trip start
[RECEIPT] - Receipt endpoint with OTP retrieval
[TRIP COMPLETE] - Completion recorded
```

## Frontend Console Errors to Watch

- React errors in console (F12 → Console tab)
- Network errors (F12 → Network tab)
- Undefined tripId calls (check URL params)

## Notes for This Test Run

1. **No drivers available**: This is expected in dev. The test validates that the retry flow works.
2. **OTP visibility**: Without drivers, we can't test full completion. See Phase 6+ setup.
3. **Redis connection**: Backend must be connected to Redis for OTP storage.
4. **Database state**: Trip records should show proper status transitions.

---

**Last Updated**: Feb 3, 2026
**Test Focus**: Trip completion, OTP visibility, Rider UI, Retry flow
