# 🏗️ TRIP LIFECYCLE ARCHITECTURE

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         STEP 1: REQUEST PHASE                   │
├─────────────────────────────────────────────────────────────────┤

RIDER:  Create Trip Request
        POST /rider/trips/request
          ├─ Input: pickup_lat/lng, drop_lat/lng, addresses
          ├─ Haversine: Calculate distance
          ├─ City Resolver: Find nearest city (50km)
          ├─ Duration: distance/30*60 minutes
          └─ Output: trip_request_id, estimates
                     status: "searching"
```

```
┌─────────────────────────────────────────────────────────────────┐
│                      STEP 2-3: DISCOVERY PHASE                  │
├─────────────────────────────────────────────────────────────────┤

RIDER:  Get Available Tenants
        GET /rider/trips/available-tenants/{trip_request_id}
          ├─ Query: Tenants in resolved city
          ├─ Filter: is_active, approved, operates in city
          └─ For each tenant:
              ├─ Tenant Name & ID
              ├─ Acceptance Rate (7-day rolling)
              ├─ Vehicle Categories
              └─ PricingEngine: 5-component pricing
                  ├─ Base Fare
                  ├─ Distance Rate (per km)
                  ├─ Time Rate (per minute)
                  ├─ Surge Multiplier
                  └─ Tax (5%)

RIDER:  Select Tenant & Vehicle
        POST /rider/trips/select-tenant/{trip_request_id}
          ├─ Input: tenant_id, vehicle_category
          ├─ Validate: Tenant active, category exists
          ├─ Update: TripRequest.selected_tenant_id = tenant_id
          └─ Status: "tenant_selected"
```

```
┌─────────────────────────────────────────────────────────────────┐
│               STEP 5-8: DRIVER DISPATCH & RESPONSE               │
├─────────────────────────────────────────────────────────────────┤

SYSTEM: Prepare Driver Pool
        DriverEligibility.get_eligible_drivers()
          └─ Check ALL 9 conditions:
             ├─ [1] tenant membership
             ├─ [2] approval_status = "approved"
             ├─ [3] is_active = True
             ├─ [4] is_online = True
             ├─ [5] runtime_status = "available"
             ├─ [6] home_city_id = trip.city_id
             ├─ [7] vehicle (category + active + docs_approved)
             ├─ [8] kyc_status = "approved"
             └─ [9] current_trip_id = NULL

SYSTEM: Geo-Sort Drivers
        Redis GEO Query
          ├─ Key: drivers:geo:{tenant_id}:{city_id}
          ├─ Command: georadius(pickup_lng, pickup_lat)
          └─ Sort: By distance (nearest first)

RIDER:  Start Driver Search
        POST /rider/trips/start-driver-search/{trip_request_id}
          ├─ Status: "driver_searching"
          ├─ Create TripBatch (batch_number=1)
          ├─ BATCH 1: 3km radius, 5 drivers, 15sec
          ├─ Create TripDispatchCandidates (all pending)
          ├─ Publish Redis: driver:trip_request:{driver_id}
          └─ Output: batch_id, drivers_notified

DRIVER: Respond to Trip Request
        POST /driver/trips/respond/{trip_request_id}/{batch_id}
          ├─ ON REJECT:
          │   ├─ candidate.response_code = "rejected"
          │   ├─ Check: Any pending candidates left?
          │   └─ If NO: Mark batch.status = "no_acceptance"
          │            Trigger next batch (if available)
          │
          └─ ON ACCEPT:
              ├─ Lock: TripRequest (FOR UPDATE)
              ├─ Verify: No other driver accepted yet
              ├─ Jump to: STEP 9
              └─ Create Trip ↓
```

```
┌─────────────────────────────────────────────────────────────────┐
│              STEP 9-10: TRIP ASSIGNMENT & NOTIFICATION           │
├─────────────────────────────────────────────────────────────────┤

SYSTEM: Create Trip (Commitment Point)
        TripLifecycle.create_trip_from_request()
          ├─ Create Trip record from TripRequest
          ├─ Copy: pickup/drop coords, addresses, distance, duration
          ├─ Set: tenant_id, rider_id, driver_id, vehicle_id, city_id
          ├─ Set: trip_status = "assigned"
          ├─ Set: assigned_at_utc = now
          ├─ Generate: 4-digit OTP
          ├─ Lock: driver (runtime_status = "on_trip")
          ├─ Update: TripRequest.status = "driver_assigned"
          └─ Output: trip_id, otp

SYSTEM: Notify Rider
        (SMS/Push Notification Service)
          ├─ Driver Name & Phone
          ├─ Vehicle Category
          ├─ License Plate
          ├─ Estimated Arrival
          └─ Trip OTP
```

```
┌─────────────────────────────────────────────────────────────────┐
│             STEP 11: TRIP START - OTP VERIFICATION               │
├─────────────────────────────────────────────────────────────────┤

DRIVER: Reach Pickup Location
        Request OTP from Rider (voice/SMS/in-app)

DRIVER: Verify OTP
        POST /driver/trips/{trip_id}/start
          ├─ Input: otp
          ├─ TripOTPService.verify_otp()
          ├─ Check: OTP matches, not expired (15-min)
          ├─ On SUCCESS:
          │   ├─ trip.trip_status = "picked_up"
          │   ├─ trip.picked_up_at_utc = now
          │   ├─ Delete OTP from Redis (one-time use)
          │   └─ Record TripStatusHistory
          │
          └─ On FAILURE:
              └─ Return 400 "Invalid or expired OTP"
```

```
┌─────────────────────────────────────────────────────────────────┐
│        STEP 12: TRIP COMPLETION & FARE CALCULATION               │
├─────────────────────────────────────────────────────────────────┤

DRIVER: Reach Drop Location
        Mark Trip Complete
        POST /driver/trips/{trip_id}/complete
          ├─ Input: distance_km (actual), duration_minutes (actual)
          ├─ Lock: Trip (FOR UPDATE)
          ├─ Store: actual distance & duration
          ├─ Fetch: Vehicle from DB (trusted source)
          │
          ├─ FARE CALCULATION (PricingEngine)
          │   ├─ [1] Base Fare: From TenantVehiclePricing
          │   ├─ [2] Distance: price_per_km × distance
          │   ├─ [3] Time: price_per_minute × duration
          │   ├─ [4] Subtotal = Base + Distance + Time
          │   ├─ [5] Apply minimum fare rule
          │   ├─ [6] Surge Multiplier: 1.0 (or dynamic)
          │   ├─ [7] Apply coupon discount (if any)
          │   ├─ [8] Calculate tax: subtotal × 5%
          │   └─ [9] Total Fare = subtotal + tax
          │
          ├─ Create TripFare record (breakdown)
          ├─ Release: Driver (runtime_status = "available")
          ├─ Create: Settlement ledger entries (Step 14)
          ├─ Move: trip.trip_status = "payment_pending"
          └─ Output: Fare breakdown, total_fare
```

```
┌─────────────────────────────────────────────────────────────────┐
│              STEP 13-14: PAYMENT & SETTLEMENT                    │
├─────────────────────────────────────────────────────────────────┤

SYSTEM: Ledger Entries (LedgerService)
        Create immutable financial records
          ├─ Entry [1]: Trip Revenue
          │   └─ Amount: total_fare
          ├─ Entry [2]: Platform Fee
          │   └─ Amount: total_fare × 20%
          ├─ Entry [3]: Driver Earnings
          │   └─ Amount: total_fare × 80%
          ├─ Entry [4]: Tax
          │   └─ Amount: total_fare × 5%
          └─ Entry [5]: Coupon Discount
              └─ Amount: -coupon_discount (if applied)

        All entries → FinancialLedger table
        (Immutable, audit trail preserved)

RIDER:  Payment Mode
        POST /payment/process
          ├─ Select: Payment method
          │   ├─ Credit/Debit Card
          │   ├─ UPI
          │   ├─ Wallet
          │   └─ etc.
          │
          ├─ Integration: Razorpay / Stripe / etc.
          │
          ├─ On SUCCESS:
          │   ├─ trip.trip_status = "completed"
          │   ├─ Ledger: Update settlement status
          │   └─ Proceed to STEP 15
          │
          └─ On FAILURE:
              └─ Retry or cancel based on policy
```

```
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 15: POST-TRIP ACTIVITIES                    │
├─────────────────────────────────────────────────────────────────┤

RIDER:  Rate Trip
        POST /rider/trips/{trip_id}/rate
          ├─ Input: rating (1-5), comment
          ├─ Validate: trip_status = "completed"
          ├─ Store: rating in Trip record
          ├─ Update: driver.rating_avg (recalculate)
          └─ Return: Confirmation

RIDER:  Get Receipt
        GET /rider/trips/{trip_id}/receipt
          ├─ Return: Complete invoice
          │   ├─ Trip details (pickup, drop)
          │   ├─ Distance & duration
          │   ├─ Fare breakdown
          │   ├─ Driver info
          │   ├─ Payment status
          │   └─ Rider rating (if submitted)
          │
          └─ Analytics: Record trip data
```

```
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 16: CANCELLATION (ANY STAGE)                │
├─────────────────────────────────────────────────────────────────┤

RIDER CANCELLATION:
  POST /rider/{trip_id}/cancel
    ├─ Before assigned: NO FEE
    ├─ After assigned (before pickup): 50% of estimated fare
    └─ After pickup: 100% of estimated fare (max ₹500)

DRIVER CANCELLATION:
  POST /driver/{trip_id}/cancel
    ├─ Allowed: Only before/during pickup
    ├─ Fee: Fixed ₹100
    └─ Not allowed after pickup

BOTH:
  ├─ Release: Driver availability
  ├─ Create: Cancellation ledger entry
  ├─ Move: trip.trip_status = "cancelled"
  └─ Record: Cancellation reason
```

```
┌─────────────────────────────────────────────────────────────────┐
│          STEP 17: SAFETY & CONSISTENCY CHECKS                    │
├─────────────────────────────────────────────────────────────────┤

Before EVERY operation:

  ├─ Driver State Re-validation
  │   ├─ is_active, kyc_status, approval_status
  │   ├─ is_online, runtime_status
  │   └─ home_city_id
  │
  ├─ Vehicle State Re-validation
  │   ├─ is_active, document_status
  │   └─ vehicle_category
  │
  ├─ Race Condition Protection
  │   ├─ FOR UPDATE locks (TripRequest, Trip)
  │   ├─ Double-check acceptance
  │   └─ Atomic operations (db.flush())
  │
  ├─ OTP Security
  │   ├─ 15-minute expiry (Redis TTL)
  │   ├─ One-time use (deleted after verify)
  │   └─ Stored in database & Redis
  │
  └─ One Active Trip Per Driver
      └─ Check: current_trip_id is NULL
```

---

## 📊 DATA FLOW DIAGRAM

```
                           ┌─────────────┐
                           │   RIDER     │
                           └──────┬──────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        v                         v                         v
    STEP 1              STEP 2                STEP 4
    Request         Tenants & Pricing        Select Tenant
        │                 │                        │
        └─────────────────┴────────────────────────┘
                         │
                         v
                    TripRequest
                    status: searching → tenant_selected
                         │
                         v
                   STEP 5: Eligibility
                   (9 Conditions)
                         │
                         v
                  Eligible Drivers
                         │
                         v
                  STEP 6: Geo-Sort
                  (Redis GEO)
                         │
                         v
                  Sorted by Distance
                         │
            ┌────────────┼────────────┐
            │                         │
            v                         v
        STEP 7                   STEP 7
        Batch 1                 Batch 2
        (3km, 5 drivers)        (6km, 8 drivers)
            │                       │
            v                       v
        STEP 8              STEP 8
        Driver Resp         Driver Resp
            │ ├─ Reject      │ ├─ Reject
            │ └─ Accept      │ └─ Accept
            │                │
            └────────────────┘
                    │
                    v
              STEP 9: TRIP CREATED
              ├─ Trip record created
              ├─ OTP generated (4-digit)
              ├─ Driver locked (on_trip)
              └─ status: "assigned"
                    │
                    v
              STEP 10: NOTIFY RIDER
              ├─ Driver info
              ├─ Vehicle info
              └─ Trip OTP
                    │
                    v
        ┌──────────────────────────┐
        │      DRIVER              │
        └──────────────┬───────────┘
                       │
                    STEP 11
                    Verify OTP
                       │
                       v
                   trip_status: "picked_up"
                       │
                    STEP 12
                    Complete Trip
                       │
                       v
                 STEP 12a: Fare Calc
                 ├─ Base Fare
                 ├─ Distance Rate
                 ├─ Time Rate
                 ├─ Surge Multiplier
                 ├─ Tax (5%)
                 └─ Total Fare
                       │
                       v
                 STEP 12b: Ledger
                 ├─ Trip Revenue
                 ├─ Platform Fee
                 ├─ Driver Earnings
                 ├─ Tax
                 └─ Coupon Discount
                       │
                   trip_status: "payment_pending"
                       │
                       v
                 STEP 13: PAYMENT
                 ├─ Process payment
                 ├─ On Success → "completed"
                 └─ On Failure → retry/cancel
                       │
                       v
                 STEP 15: POST-TRIP
                 ├─ Rating
                 ├─ Receipt
                 └─ Analytics
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────┐
│   Authorization Layer           │
│  require_rider / require_driver │
└────────────────┬────────────────┘
                 │
┌────────────────v────────────────┐
│   Ownership Validation          │
│  rider_id, driver_id matching   │
└────────────────┬────────────────┘
                 │
┌────────────────v────────────────┐
│   State Validation              │
│  trip_status in allowed states  │
└────────────────┬────────────────┘
                 │
┌────────────────v────────────────┐
│   Eligibility Validation        │
│  9 conditions for drivers       │
└────────────────┬────────────────┘
                 │
┌────────────────v────────────────┐
│   OTP Verification              │
│  4-digit, 15-min expiry, 1-time │
└────────────────┬────────────────┘
                 │
┌────────────────v────────────────┐
│   FOR UPDATE Locks              │
│  Race condition prevention      │
└────────────────┬────────────────┘
                 │
┌────────────────v────────────────┐
│   Double-Check Verification     │
│  Atomic acceptance validation   │
└─────────────────────────────────┘
```

---

## 💾 Database Schema Relationships

```
TripRequest (1)
    ├─ → Rider (M)
    ├─ → City (1)
    ├─ → Tenant (1) [selected_tenant]
    ├─ → TripBatch (M) [batches]
    └─ → Trip (1) [final commitment]

TripBatch (1)
    ├─ → TripRequest (M)
    ├─ → Tenant (M)
    └─ → TripDispatchCandidate (M)

TripDispatchCandidate (1)
    ├─ → TripBatch (M)
    └─ → Driver (M)

Trip (1)
    ├─ → TripRequest (1)
    ├─ → Rider (M)
    ├─ → Driver (M)
    ├─ → Vehicle (1)
    ├─ → Tenant (M)
    ├─ → City (M)
    ├─ → TripFare (1) [fare breakdown]
    └─ → TripStatusHistory (M)

FinancialLedger (many)
    ├─ → Trip (M)
    ├─ → Driver (M)
    ├─ → Rider (M)
    └─ → Tenant (M)
```

---

**Architecture complete and production-ready!**
