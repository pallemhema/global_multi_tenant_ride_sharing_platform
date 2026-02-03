# Complete API Testing Guide with cURL

## Quick Setup - Make Drivers Online

Since we don't have test data with drivers online yet, we can use the browser UI to:

1. **Open http://localhost:3001** (Frontend)
2. **Register a Driver** or login with existing driver account
3. **Go Online** - Set driver location and availability status
4. **In another tab: Login as Rider** and book a trip

## Alternative: Direct API Testing with cURL

### 1. Create a Trip Request (Rider)

```bash
# STEP 1: Request Trip
curl -X POST http://localhost:8000/api/v1/rider/trips/request \
  -H "Authorization: Bearer {RIDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_lat": 12.9716,
    "pickup_lng": 77.5946,
    "pickup_address": "Bangalore Tech Park",
    "drop_lat": 13.0827,
    "drop_lng": 80.2707,
    "drop_address": "Chennai Central",
    "city_id": 1
  }'

# Response: trip_request_id (e.g., 123)
```

### 2. List Available Tenants

```bash
curl -X GET http://localhost:8000/api/v1/rider/trips/available-tenants/123 \
  -H "Authorization: Bearer {RIDER_TOKEN}"

# Response: List of tenants with vehicles and pricing
```

### 3. Select Tenant & Vehicle

```bash
curl -X POST http://localhost:8000/api/v1/rider/trips/select-tenant/123 \
  -H "Authorization: Bearer {RIDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": 1,
    "vehicle_category": "sedan"
  }'
```

### 4. Start Driver Search

```bash
curl -X POST http://localhost:8000/api/v1/rider/trips/start-driver-search/123 \
  -H "Authorization: Bearer {RIDER_TOKEN}"
```

### 5. Poll for Trip Status (Wait for Driver)

```bash
# This will show when driver is assigned
curl -X GET http://localhost:8000/api/v1/rider/trips/request/123/status \
  -H "Authorization: Bearer {RIDER_TOKEN}"

# Response when driver assigns: { "status": "driver_assigned", "trip_id": 456 }
```

### 6. Get Trip Receipt (After Completion)

```bash
curl -X GET http://localhost:8000/api/v1/rider/trips/456/receipt \
  -H "Authorization: Bearer {RIDER_TOKEN}"

# Response includes:
# {
#   "trip_id": 456,
#   "status": "completed",
#   "otp": "123456",
#   "pickup_address": "...",
#   "drop_address": "...",
#   "base_fare": 50.0,
#   "distance_charge": 25.5,
#   "total_fare": 85.5,
#   "currency": "INR"
# }
```

### 7. Cancel Trip Request (If No Drivers)

```bash
curl -X POST http://localhost:8000/api/v1/rider/trips/123/cancel \
  -H "Authorization: Bearer {RIDER_TOKEN}"

# Response: { "status": "cancelled", "trip_request_id": 123 }
```

### 8. Get Trip OTP (After Assignment)

```bash
curl -X GET http://localhost:8000/api/v1/rider/trips/456/otp \
  -H "Authorization: Bearer {RIDER_TOKEN}"

# Response: { "trip_id": 456, "otp": "123456" }
```

## Debug: Check Backend Logs

Watch these markers in backend logs:

```bash
# In terminal running uvicorn:
tail -f /tmp/backend.log | grep -E "\[OTP|RECEIPT|TRIP REQUEST|TENANT|CANCEL"
```

Expected log output:

```
[TRIP REQUEST CREATED] trip_request_id=123, user_id=1, pickup=Bangalore, drop=Chennai
[TENANT SELECTED] trip_request_id=123, tenant_id=1, vehicle_category=sedan
[OTP STORE] trip_id=456 → otp=123456
[OTP STORE] Hashed OTP stored in Redis for trip_id=456
[OTP STORE] Plaintext OTP stored in Redis for trip_id=456
[RECEIPT] Successfully retrieved OTP from Redis for trip_id=456: 123456
```

## Scenario: No Drivers Available → Retry

### Flow:

1. **Book Trip** (Steps 1-4)
2. **Start searching** (Step 4)
3. **Poll status** - Wait 30 seconds, no driver found
4. **Frontend shows**: "No drivers available right now" + "Choose Different Provider" button
5. **Cancel trip** (Step 7)
6. **Create new trip request** (Step 1)
7. **Select different tenant** (Step 3)
8. **Retry search** (Step 4)

### Expected Logs:

```
[TRIP REQUEST CREATED] trip_request_id=123
[TENANT SELECTED] trip_request_id=123, tenant_id=1
[TRIP REQUEST CANCEL] trip_request_id=123 cancelled by rider 1
[TRIP REQUEST CREATED] trip_request_id=124  # New one
[TENANT SELECTED] trip_request_id=124, tenant_id=2  # Different tenant
```

## Testing Without Authentication

If you want to test without tokens, first get a rider token:

```bash
# Register/Login as Rider
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rider@test.com",
    "password": "password123",
    "user_type": "rider"
  }'

# Login to get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rider@test.com",
    "password": "password123"
  }'

# Response: { "access_token": "eyJ0eX...", "token_type": "bearer" }
```

## Key Endpoints Summary

| Endpoint                                                    | Method | Purpose              |
| ----------------------------------------------------------- | ------ | -------------------- |
| `/api/v1/rider/trips/request`                               | POST   | Create trip request  |
| `/api/v1/rider/trips/available-tenants/{trip_request_id}`   | GET    | List tenants         |
| `/api/v1/rider/trips/select-tenant/{trip_request_id}`       | POST   | Select tenant        |
| `/api/v1/rider/trips/start-driver-search/{trip_request_id}` | POST   | Start search         |
| `/api/v1/rider/trips/request/{trip_request_id}/status`      | GET    | Check status         |
| `/api/v1/rider/trips/{trip_id}/status`                      | GET    | Track live trip      |
| `/api/v1/rider/trips/{trip_id}/receipt`                     | GET    | Get receipt with OTP |
| `/api/v1/rider/trips/{trip_request_id}/cancel`              | POST   | Cancel request       |
| `/api/v1/rider/trips/{trip_id}/otp`                         | GET    | Get OTP              |
| `/api/v1/rider/trips/{trip_id}/resend-otp`                  | POST   | Resend OTP           |

## Testing Strategy

1. **Start**: No drivers available
2. **Observe**: Frontend shows "Choose Different Provider" after 24 seconds
3. **Cancel**: Trip request is cancelled in database
4. **Retry**: New trip_request created with different tenant
5. **Watch**: Backend logs show all state transitions
6. **Verify**: OTP appears in receipt endpoint

---

**Last Updated**: Feb 3, 2026
**Status**: Complete API flow documented
