# Quick Start Testing Guide

## 1. Start Backend (If Not Running)

```bash
cd ~/Desktop/'Ride sharing'/backend
~/.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Expected output**:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
✅ Redis connected
```

## 2. Start Frontend (If Not Running)

```bash
cd ~/Desktop/'Ride sharing'/client
npm run dev
```

**Expected output**:

```
VITE v5.4.21 ready in Xms
➜ Local: http://localhost:3001/
```

## 3. Monitor Backend Logs (In New Terminal)

```bash
# Watch for key markers
ps aux | grep uvicorn | grep -v grep  # Get process
tail -f /proc/[PID]/fd/1 | grep -E "\[OTP|RECEIPT|TRIP|CANCEL|STORE"

# Or if logged to file:
tail -f /tmp/backend.log | grep -E "\[OTP|RECEIPT|TRIP|CANCEL"
```

## 4. Test Scenario: Trip Creation Without Drivers

### Browser 1 (Rider): http://localhost:3001

1. **Login/Register as Rider**
   - Email: `rider@test.com`
   - Password: `password123`

2. **Book a Ride**
   - Click "Book a Ride"
   - Enter pickup/dropoff (or use map)
   - Select city

3. **Choose Provider**
   - Select any tenant (e.g., "Provider A")
   - Select vehicle (e.g., "Sedan")
   - Click "Proceed"

4. **Searching Page**
   - System will search for drivers
   - After ~24 seconds, you'll see:
     - ⚠️ "No drivers available right now"
     - ✅ "Choose Different Provider" button

5. **Retry Flow**
   - Click "Choose Different Provider"
   - Redirected to dashboard
   - In backend logs, see: `[TRIP REQUEST CANCEL] trip_request_id=X`
   - Click "Book a Ride" again
   - Select DIFFERENT tenant this time
   - Repeat search

### Browser 2 (Driver): http://localhost:3001

1. **Login as Driver**
   - Email: `driver@test.com`
   - Password: `password123`

2. **Go Online**
   - Update location (map or GPS)
   - Set availability to "Online"
   - Wait for trip offers

3. **Accept Trip**
   - When trip appears in list, click "Accept"
   - Backend logs should show:
     ```
     [OTP STORE] trip_id=12 → otp=123456
     [OTP STORE] Hashed OTP stored in Redis
     [OTP STORE] Plaintext OTP stored in Redis
     ```

4. **Complete Trip**
   - Navigate to pickup
   - Arrive at location
   - Driver completes trip with distance/duration
   - Confirmation screen

### Browser 1 (Rider): Trip Completion

1. **Completion Page Appears**
   - ✅ "Trip Completed!" header
   - ✅ **OTP Box** (amber colored):
     - Shows: `123456` (or whatever OTP was generated)
     - Text: "Keep this OTP for payment reference"
   - ✅ **Fare Breakdown**:
     - Base Fare: ₹50.00
     - Distance Charge: ₹25.50
     - Surge (if applicable): ₹10.00
     - Tax: ₹12.00
     - **Payable Amount**: ₹97.50
   - ✅ "Book Another Ride" button

2. **Verify Backend Logs**
   ```
   [RECEIPT] Successfully retrieved OTP from Redis for trip_id=12: 123456
   ```

## 5. Expected Backend Log Flow

Complete flow for successful trip:

```
[TRIP REQUEST CREATED] trip_request_id=26, user_id=1, city_id=1
[TENANT SELECTED] trip_request_id=26, tenant_id=1, vehicle_category=sedan
[BATCH 1] radius=10.0km → drivers=[]
[BATCH 2] radius=20.0km → drivers=['24']
[OTP STORE] trip_id=12 → otp=534239
[OTP STORE] Hashed OTP stored in Redis for trip_id=12, TTL=1800s
[OTP STORE] Plaintext OTP stored in Redis for trip_id=12
[RECEIPT] Successfully retrieved OTP from Redis for trip_id=12: 534239
```

**If no drivers** (first attempt):

```
[TRIP REQUEST CREATED] trip_request_id=26
[TENANT SELECTED] trip_request_id=26, tenant_id=1
[BATCH 1] radius=10.0km → drivers=[]
[BATCH 2] radius=20.0km → drivers=[]
[BATCH 3] radius=50.0km → drivers=[]
# (No drivers found - frontend shows retry message)
[TRIP REQUEST CANCEL] trip_request_id=26 cancelled by rider 1

# User creates new trip:
[TRIP REQUEST CREATED] trip_request_id=27
[TENANT SELECTED] trip_request_id=27, tenant_id=2  # Different tenant!
[BATCH 1] radius=10.0km → drivers=['24']
```

## 6. cURL Testing (Alternative)

If you prefer API testing:

```bash
# Get auth token (login)
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rider@test.com","password":"password123"}' \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Create trip request
TRIP_ID=$(curl -s -X POST http://localhost:8000/api/v1/rider/trips/request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_lat":12.9716,"pickup_lng":77.5946,"pickup_address":"Bangalore",
    "drop_lat":13.0827,"drop_lng":80.2707,"drop_address":"Chennai",
    "city_id":1
  }' | grep -o '"trip_request_id":[0-9]*' | cut -d':' -f2)

echo "Trip Request ID: $TRIP_ID"

# List tenants
curl -s -X GET "http://localhost:8000/api/v1/rider/trips/available-tenants/$TRIP_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Select tenant
curl -s -X POST "http://localhost:8000/api/v1/rider/trips/select-tenant/$TRIP_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":1,"vehicle_category":"sedan"}' | python3 -m json.tool

# Start search
curl -s -X POST "http://localhost:8000/api/v1/rider/trips/start-driver-search/$TRIP_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Poll status
curl -s -X GET "http://localhost:8000/api/v1/rider/trips/request/$TRIP_ID/status" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

## 7. What to Look For

✅ **Success Indicators**:

- Backend responds within 2 seconds
- No red errors in frontend console
- OTP appears in amber box on completion page
- Fare breakdown shows all components
- "Choose Different Provider" button appears after ~24 seconds of no drivers

❌ **Error Indicators**:

- 500 errors in browser console
- "Cannot read property of undefined" errors
- OTP box empty even though driver accepted
- Fare showing $0 or NaN

## 8. Debugging Tips

**Check Backend Status**:

```bash
curl -s http://localhost:8000/docs | grep -o "swagger" && echo "✓ Backend UP" || echo "✗ Backend DOWN"
```

**Check Frontend Status**:

```bash
curl -s http://localhost:3001 | grep -o "react" && echo "✓ Frontend UP" || echo "✗ Frontend DOWN"
```

**Check Redis Connection**:

```bash
# From backend logs, you should see:
# ✅ Redis connected
```

**Verify OTP in Redis** (if you have redis-cli):

```bash
redis-cli GET "trip:otp:plain:12"  # Returns: 534239 (or similar)
redis-cli GET "trip:otp:12"         # Returns: [hashed value]
```

## 9. Common Issues & Solutions

| Issue                        | Solution                                                  |
| ---------------------------- | --------------------------------------------------------- |
| 404 on `/cancel` endpoint    | Make sure backend is restarted after code changes         |
| OTP not showing              | Check backend logs for `[RECEIPT] ERROR reading OTP`      |
| "Cannot select tenant" error | You already selected a tenant - use `/cancel` first       |
| No drivers found (expected)  | This is normal - use "Choose Different Provider" to retry |
| Fare showing $0              | Database might not have trip_fare record - check DB       |

---

**Ready to Test!** Follow steps 1-4 above for a complete end-to-end test.
