# Rider Flow: Indefinite Retries & Tenant Switching

## 🎯 Overview

Riders can now indefinitely retry trip requests and switch between providers (tenants) when no drivers are available. The system keeps tenant selection and retry actions enabled at all times.

## ✅ Implementation Details

### 1. Backend Changes

#### A. Start Driver Search Endpoint

**File**: [`backend/app/api/v1/trips/trip_request.py`](backend/app/api/v1/trips/trip_request.py#L388)

**Change**: Return 200 OK with `status: "no_drivers_available"` instead of 404 error

```python
# ✅ NO DRIVERS: Return 200 OK with empty drivers list
# This allows riders to retry or switch tenants without blocking the flow
if not nearby_drivers:
    return {
        "trip_request_id": trip_req.trip_request_id,
        "batch_id": None,
        "batch_number": 0,
        "drivers_notified": 0,
        "status": "no_drivers_available",
        "message": "No drivers available right now. Please try again or select a different provider.",
    }
```

**Key Points**:

- Returns 200 OK (not 404) - allows graceful handling on frontend
- Sets `status: "no_drivers_available"` for frontend to detect
- No TripBatch created when no drivers found
- Trip request stays in `"tenant_selected"` state, ready for retry

#### B. Tenant Selection Endpoint

**File**: [`backend/app/api/v1/trips/trip_request.py`](backend/app/api/v1/trips/trip_request.py#L303)

**Change**: Allow re-selecting tenants from multiple states

```python
# ✅ ALLOW re-selection from: searching, tenant_selected, driver_searching, or no_drivers_available
# This enables riders to switch providers when no drivers are found
allowed_statuses = ("searching", "tenant_selected", "driver_searching", "no_drivers_available")
if trip_req.status not in allowed_statuses:
    raise HTTPException(status_code=400, detail=f"Cannot select tenant when trip status is {trip_req.status}")
```

**Key Points**:

- Previously only allowed from `"searching"` status
- Now allows from 4 states, enabling mid-search tenant switching
- Resets status back to `"tenant_selected"` when changed
- Ready for immediate retry or new search

### 2. Frontend Changes

#### A. Searching Component

**File**: [`client/src/pages/rider/Searching.jsx`](client/src/pages/rider/Searching.jsx)

**Changes**:

1. **Detect "no_drivers_available" response**

   ```jsx
   else if (res?.status === "no_drivers_available") {
     setNoDriversFound(true);
   }
   ```

2. **Show clear message with action buttons**
   - "Retry with Same Provider" button
   - "Choose Different Provider" button

3. **Implement handleRetry function**

   ```jsx
   const handleRetry = async () => {
     setIsRetrying(true);
     setNoDriversFound(false);
     try {
       await tripApi.startDriverSearch(tripRequestId);
     } catch (e) {
       setError(e?.response?.data?.detail || "Failed to retry...");
       setNoDriversFound(true);
     } finally {
       setIsRetrying(false);
     }
   };
   ```

4. **Implement handleChangeTenant function**
   ```jsx
   const handleChangeTenant = () => {
     navigate(`/rider/options/${tripRequestId}`);
   };
   ```

**Key Features**:

- Non-blocking "no drivers" message
- Two clear action buttons
- Loading state during retry
- Error handling with user-friendly messages
- All buttons remain enabled for retries

#### B. ChooseOption Component

**No changes required** - Already supports re-selection via tenant selection endpoint

Works seamlessly with backend changes to allow tenant switching at any time.

## 📋 Rider User Journey

### Scenario 1: Retry Same Provider

```
1. Rider selects Tenant A + Economy
2. System searches for drivers
3. ❌ No drivers found
4. Message shown: "No drivers available right now"
5. Rider clicks "Retry with Same Provider"
6. System searches again
7. ✅ Driver found → Trip proceeds
```

### Scenario 2: Switch to Different Provider

```
1. Rider selects Tenant A + Economy
2. System searches for drivers
3. ❌ No drivers found
4. Message shown: "No drivers available right now"
5. Rider clicks "Choose Different Provider"
6. Navigates back to provider selection
7. Rider selects Tenant B + Premium
8. System searches for drivers
9. ✅ Driver found → Trip proceeds
```

### Scenario 3: Indefinite Retries

```
1. Rider selects Tenant A
2. ❌ No drivers
3. Retry → Still no drivers
4. Retry → Still no drivers
5. Switch to Tenant B
6. ❌ No drivers
7. Retry → Still no drivers
8. Switch back to Tenant A
9. Retry → ✅ Driver found!
```

## 🔄 API Response Format

### Start Driver Search - No Drivers Available

```json
{
  "trip_request_id": 27,
  "batch_id": null,
  "batch_number": 0,
  "drivers_notified": 0,
  "status": "no_drivers_available",
  "message": "No drivers available right now. Please try again or select a different provider."
}
```

### Start Driver Search - Drivers Found

```json
{
  "trip_request_id": 27,
  "batch_id": 5,
  "batch_number": 1,
  "drivers_notified": 3,
  "status": "driver_search_started",
  "message": "Notified 3 drivers"
}
```

## 🔒 Key Safety Features

1. **No Orphaned Requests**: TripRequest only transitions to "driver_searching" when drivers exist
2. **Cleanly Reversible**: Changing tenant resets status to "tenant_selected"
3. **No Lost State**: All trip data preserved through retries/switches
4. **Clear Feedback**: User sees exactly what happened and what to do next
5. **No Rate Limiting**: Riders can retry indefinitely (backend doesn't create records for failed searches)

## 📊 State Transitions

```
┌──────────┐
│ searching│
└────┬─────┘
     │
     v
┌──────────────────┐
│ tenant_selected  │
└────┬─────────────┘
     │
     v (startDriverSearch)
┌──────────────────────┐
│ no_drivers_available │  ← If no drivers found
└────┬─────────────────┘
     │ (retry or change tenant)
     v
     OR
     v (change tenant)
┌──────────────────┐
│ tenant_selected  │  ← Reset, ready for new search
└────┬─────────────┘
     │
     v (startDriverSearch)
┌─────────────────┐
│ driver_searching│  ← If drivers found
└─────────────────┘
     │
     v (driver accepts)
┌─────────────────┐
│ driver_assigned │
└─────────────────┘
```

## ✨ User Experience Improvements

| Before                             | After                                                    |
| ---------------------------------- | -------------------------------------------------------- |
| "No drivers available" → 404 Error | "No drivers available" → Clear message with retry option |
| Cannot retry same tenant           | Can retry same tenant indefinitely                       |
| Cannot switch tenants mid-search   | Can switch tenants anytime                               |
| Rigid flow                         | Flexible, user-friendly flow                             |
| No feedback on search progress     | Clear feedback at each step                              |

## 🧪 Testing Checklist

- [ ] No drivers available → Shows message with both buttons enabled
- [ ] Click "Retry with Same Provider" → Searches again with same tenant
- [ ] Click "Choose Different Provider" → Navigates back to option selection
- [ ] Select different tenant → Search begins with new tenant
- [ ] Retry multiple times → Works indefinitely
- [ ] Switch between tenants multiple times → Works smoothly
- [ ] Driver appears after retry → Auto-navigates to Assigned page
- [ ] No 404 errors in console or backend logs
- [ ] Trip request status correctly reflects current state
- [ ] All buttons remain enabled during no-drivers state
