# app/api/v1/trips/trip_request.py
"""
Trip Request Endpoints - Multi-tenant ride-sharing trip flow

1️⃣ Create Trip Request (rider)
2️⃣ List Available Tenants & Pricing
3️⃣ Select Tenant (rider)
4️⃣ Start Driver Search (batch-wise)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, aliased
from datetime import datetime, timezone
import math
import json
from sqlalchemy import or_, and_
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError


from app.core.dependencies import get_db
from app.core.security.roles import require_rider
from app.models.core.users.users import User
from app.models.core.tenants.tenants import Tenant
from app.models.core.tenants.tenant_cities import TenantCity
from app.models.lookups.city import City
from app.models.core.trips.trip_request import TripRequest
from app.models.core.drivers.driver_shifts import DriverShift
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.fleet_owners.driver_vehicle_assignments import DriverVehicleAssignment
from app.models.core.trips.trips import Trip
from app.schemas.core.trips.trip_request import (
    TripRequestCreate,
    TripRequestOut,
    AvailableTenantsListOut,
    VehiclePricingInfo,
    TenantAvailabilityInfo,
    TenantSelectionPayload,
    TenantSelectionResponse,
)
from app.core.fare.tenant_vehicle_categoy_price import get_vehicle_pricing
from app.models.lookups.vehicle_category import VehicleCategory
from app.schemas.core.trips.trip_request import TripStatusOut
from sqlalchemy.orm import aliased
VehicleAssignmentVehicle = aliased(Vehicle)
import os
from app.core.trips.trip_otp_service import _otp_plain_key

router = APIRouter(
    prefix="/rider/trips",
    tags=["Rider – Trip Management"],
)


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula.
    Returns distance in kilometers.
    """
    R = 6371  # Earth radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


# ============================================
# 1️⃣ CREATE TRIP REQUEST
# ============================================

@router.post("/request", response_model=TripRequestOut, status_code=status.HTTP_201_CREATED)
def create_trip_request(
    payload: TripRequestCreate,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    """
    STEP 1: Rider creates a trip request.
    
    - Validate coordinates
    - Resolve city from pickup location
    - Create TripRequest record with status="searching"
    - No tenant/driver assignment yet
    
    Returns: TripRequest details with trip_request_id
    """
    now = datetime.now(timezone.utc)
    
    # ====== Resolve city from pickup coordinates using city boundary polygon ======
    # We require pickup and drop to be inside the same city's boundary polygon.
    

    # Cast both sides to geometry explicitly to avoid mixed-type errors when
    # boundary may be stored as geography or geometry in different environments.
    pickup_filter_sql = text(
        "ST_Contains(boundary::geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geometry)"
    )
    drop_filter_sql = text(
        "ST_Contains(boundary::geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geometry)"
    )

    try:
        closest_city = (
            db.query(City)
            .filter(City.is_active.is_(True))
            .filter(pickup_filter_sql)
            .params(lng=payload.pickup_lng, lat=payload.pickup_lat)
            .first()
        )
    except ProgrammingError as exc:
        # Common cause: PostGIS not installed or column types mismatch
        raise HTTPException(status_code=500, detail=(
            "Spatial query failed. Ensure PostGIS is installed and the cities.boundary "
            "column is a geometry(Polygon,4326) or appropriate cast exists. Debug: " + str(exc)
        ))

    if not closest_city:
        raise HTTPException(status_code=400, detail="Service not available in your pickup location")

    try:
        drop_in_city = (
            db.query(City)
            .filter(City.city_id == closest_city.city_id)
            .filter(drop_filter_sql)
            .params(lng=payload.drop_lng, lat=payload.drop_lat)
            .first()
        )
    except ProgrammingError as exc:
        raise HTTPException(status_code=500, detail=(
            "Spatial query failed when checking drop location. Ensure PostGIS is installed "
            "and cities.boundary is a valid geometry. Debug: " + str(exc)
        ))

    if not drop_in_city:
        raise HTTPException(status_code=400, detail="Drop location is outside service area for this city")
    
    # ====== Calculate estimated distance ======
    estimated_distance = haversine_distance(
        payload.pickup_lat,
        payload.pickup_lng,
        payload.drop_lat,
        payload.drop_lng,
    )
    
    # Rough estimate: average speed 30 km/h in city
    estimated_duration = int((estimated_distance / 30) * 60)
    
    # ====== Create TripRequest ======
    trip_request = TripRequest(
        user_id=rider.user_id,
        pickup_lat=payload.pickup_lat,
        pickup_lng=payload.pickup_lng,
        pickup_address=payload.pickup_address,
        drop_lat=payload.drop_lat,
        drop_lng=payload.drop_lng,
        drop_address=payload.drop_address,
        city_id=closest_city.city_id,
        status="searching",
        estimated_distance_km=estimated_distance,
        estimated_duration_minutes=estimated_duration,
        created_at_utc=now,
    )
    
    db.add(trip_request)
    db.commit()
    db.refresh(trip_request)
    
    return trip_request


# ============================================
# 2️⃣ LIST AVAILABLE TENANTS & PRICING
# ============================================

@router.get("/available-tenants/{trip_request_id}", response_model=AvailableTenantsListOut)
def list_available_tenants(
    trip_request_id: int,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    """
    STEP 2: Show rider all available tenants in the city with pricing.
    
    Eligibility:
    - Tenant must be active
    - Tenant must operate in the city
    
    For each tenant:
    - vehicle_category & pricing
    - acceptance_rate (accepted / total requests in last 7 days)
    
    Returns: List of tenants with their vehicle categories and pricing
    """
    
    # ====== Get trip request ======
    trip_req = db.query(TripRequest).filter(
        TripRequest.trip_request_id == trip_request_id,
        TripRequest.user_id == rider.user_id,
    ).first()
    
    if not trip_req:
        raise HTTPException(status_code=404, detail="Trip request not found")
    
    if trip_req.status != "searching":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot view tenants when trip status is {trip_req.status}"
        )
    
    city_id = trip_req.city_id
    estimated_distance = trip_req.estimated_distance_km or 1.0
    
    # ====== Get active tenants in city ======
    tenant_ids = (
        db.query(TenantCity.tenant_id)
        .filter(
            TenantCity.city_id == city_id,
            TenantCity.is_active.is_(True),
        )
        .all()
    )
    
    if not tenant_ids:
        raise HTTPException(
            status_code=404,
            detail="No service available in this city"
        )
    
    tenant_ids = [t[0] for t in tenant_ids]
    
    # ====== Build tenant availability info ======
    tenants_info = []
    
    for tid in tenant_ids:
        tenant = db.query(Tenant).filter(
            Tenant.tenant_id == tid,
            Tenant.status == "active",
        ).first()
        
        if not tenant:
            continue

        estimated_duration = trip_req.estimated_duration_minutes
        

        vehicle_categories = db.query(VehicleCategory).all()

        vehicles = []

        for category in vehicle_categories:
            pricing = get_vehicle_pricing(
                db=db,
                tenant_id=tenant.tenant_id,
                city_id=city_id,
                vehicle_category=category.category_code,
                estimated_distance_km=estimated_distance,
                estimated_duration_minutes=estimated_duration,
            )

            if pricing:
                vehicles.append(VehiclePricingInfo(**pricing))

        
        # Calculate acceptance rate
        # acceptance_rate = accepted_trips / total_trip_requests (last 7 days)
        # For now, default to 0.95 (95%)
        acceptance_rate = 0.95
        
        tenants_info.append(TenantAvailabilityInfo(
            tenant_id=tenant.tenant_id,
            tenant_name=tenant.tenant_name,
            acceptance_rate=acceptance_rate,
            vehicles=vehicles,
        ))
    
    if not tenants_info:
        raise HTTPException(
            status_code=404,
            detail="No available tenants with pricing in this city"
        )
    
    city = db.query(City).filter(City.city_id == city_id).first()
    city_name = city.city_name if city else "Unknown"
    
    return AvailableTenantsListOut(
        trip_request_id=trip_request_id,
        city_id=city_id,
        city_name=city_name,
        tenants=tenants_info,
    )


# ============================================
# 3️⃣ SELECT TENANT
# ============================================

@router.post("/select-tenant/{trip_request_id}", response_model=TenantSelectionResponse)
def select_tenant(
    trip_request_id: int,
    payload: TenantSelectionPayload,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    trip_req = db.query(TripRequest).filter(
        TripRequest.trip_request_id == trip_request_id,
        TripRequest.user_id == rider.user_id,
    ).first()

    if not trip_req:
        raise HTTPException(status_code=404, detail="Trip request not found")

    # ✅ ALLOW re-selection from: searching, tenant_selected, or no_drivers_available
    # This enables riders to switch providers when no drivers are found
    allowed_statuses = ("searching", "tenant_selected", "driver_searching", "no_drivers_available")
    if trip_req.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot select tenant when trip status is {trip_req.status}",
        )

    tenant_city = db.query(TenantCity).filter(
        TenantCity.tenant_id == payload.tenant_id,
        TenantCity.city_id == trip_req.city_id,
        TenantCity.is_active.is_(True),
    ).first()

    if not tenant_city:
        raise HTTPException(
            status_code=400,
            detail="Selected tenant does not operate in this city",
        )

    trip_req.selected_tenant_id = payload.tenant_id
    trip_req.vehicle_category = payload.vehicle_category
    trip_req.status = "tenant_selected"
    trip_req.updated_at_utc = datetime.now(timezone.utc)

    db.commit()
    db.refresh(trip_req)

    return TenantSelectionResponse(
        trip_request_id=trip_req.trip_request_id,
        status="tenant_selected",
        selected_tenant_id=payload.tenant_id,
        vehicle_category=payload.vehicle_category,
        message=f"Searching for {payload.vehicle_category} drivers...",
    )
# ============================================
# 4️⃣ START BATCH-WISE DRIVER SEARCH
# ============================================

# DEV CONFIG – large radius so drivers are always found
BATCH_CONFIG = [
    {
        "batch_number": 1,
        "radius_km": 10.0,   # was 3.0
        "max_drivers": 5,
        "timeout_sec": 15,
    },
    {
        "batch_number": 2,
        "radius_km": 20.0,   # was 6.0
        "max_drivers": 8,
        "timeout_sec": 20,
    },
    {
        "batch_number": 3,
        "radius_km": 30.0,   # was 10.0
        "max_drivers": 12,
        "timeout_sec": 25,
    },
]



class DriverSearchStartResponse:
    """Response when driver search begins"""
    def __init__(self, trip_request_id: int, batch_id: int, drivers_notified: int):
        self.trip_request_id = trip_request_id
        self.batch_id = batch_id
        self.drivers_notified = drivers_notified
        self.status = "driver_search_started"


@router.post("/start-driver-search/{trip_request_id}")
def start_driver_search(
    trip_request_id: int,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    from app.models.core.trips.trip_batch import TripBatch
    from app.models.core.trips.trip_dispatch_candidates import TripDispatchCandidate
    from app.core.redis import redis_client

    # ------------------------------------------------
    # 1️⃣ Fetch trip request
    # ------------------------------------------------
    trip_req = db.query(TripRequest).filter(
        TripRequest.trip_request_id == trip_request_id,
        TripRequest.user_id == rider.user_id,
    ).first()

    if not trip_req:
        raise HTTPException(status_code=404, detail="Trip request not found")

    if trip_req.status not in ("tenant_selected", "no_drivers_available"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot search drivers when trip status is {trip_req.status}",
        )

    if not trip_req.selected_tenant_id:
        raise HTTPException(status_code=400, detail="No tenant selected")

    now = datetime.now(timezone.utc)
    tenant_id = trip_req.selected_tenant_id
    city_id = trip_req.city_id

    # Update status to driver_searching (whether first attempt or retry)
    trip_req.status = "driver_searching"
    db.commit()

    # ------------------------------------------------
    # 2️⃣ Batch config (start with batch 1)
    # ------------------------------------------------
    batch_cfg = BATCH_CONFIG[0]

    # ------------------------------------------------
    # 3️⃣ Redis GEO lookup (CAST TO FLOAT!)
    # ------------------------------------------------
    geo_key = f"drivers:geo:{tenant_id}:{city_id}"
    print("geo key :",geo_key)

    pickup_lat = float(trip_req.pickup_lat)
    pickup_lng = float(trip_req.pickup_lng)
    print("pickup_lat:",pickup_lat)
    print("pickup_lng:",pickup_lng)

    nearby_driver_ids = []

    for batch_cfg in BATCH_CONFIG:
        nearby_drivers = redis_client.georadius(
            geo_key,
            pickup_lng,
            pickup_lat,
            float(batch_cfg["radius_km"]),
            unit="km",
            count=int(batch_cfg["max_drivers"]),
            sort="ASC",
        )

        print(
            f"[BATCH {batch_cfg['batch_number']}] "
            f"radius={batch_cfg['radius_km']}km → drivers={nearby_drivers}"
        )

        if nearby_drivers:
            nearby_driver_ids = [
                int(d.decode() if isinstance(d, bytes) else d)
                for d in nearby_drivers
            ]
            break




    print("nearby_drivers:",nearby_drivers)

    # ✅ NO DRIVERS: Return 200 OK with empty drivers list instead of 404
    # This allows riders to retry or switch tenants without blocking the flow
    if not nearby_drivers:
        # Update trip request status to no_drivers_available
        trip_req.status = "no_drivers_available"
        db.commit()
        return {
            "trip_request_id": trip_req.trip_request_id,
            "batch_id": None,
            "batch_number": 0,
            "drivers_notified": 0,
            "status": "no_drivers_available",
            "message": "No drivers available right now. Please try again or select a different provider.",
        }

    # ------------------------------------------------
    # 4️⃣ Filter available drivers (CORRECT KEYS)
    # ------------------------------------------------
    nearby_driver_ids = [
    int(raw_id.decode() if isinstance(raw_id, bytes) else raw_id)
    for raw_id in nearby_drivers
    ]

    if not nearby_driver_ids:
        # ✅ NO DRIVERS: Return gracefully instead of blocking
        # Update trip request status to no_drivers_available
        trip_req.status = "no_drivers_available"
        db.commit()
        return {
            "trip_request_id": trip_req.trip_request_id,
            "batch_id": None,
            "batch_number": 0,
            "drivers_notified": 0,
            "status": "no_drivers_available",
            "message": "No drivers available right now. Please try again or select a different provider.",
        }



   
    available_driver_ids =nearby_driver_ids


    

    # ------------------------------------------------
    # 6️⃣ Create TripBatch
    # ------------------------------------------------
    trip_batch = TripBatch(
        trip_request_id=trip_req.trip_request_id,
        tenant_id=tenant_id,
        batch_number=batch_cfg["batch_number"],
        batch_status="active",
        search_radius_km=str(batch_cfg["radius_km"]),
        max_drivers_in_batch=batch_cfg["max_drivers"],
        timeout_seconds=batch_cfg["timeout_sec"],
        created_at_utc=now,
        started_at_utc=now,
    )
    db.add(trip_batch)
    db.flush()

    # ------------------------------------------------
    # 7️⃣ Create TripDispatchCandidate records (link to pre-created trip)
    # ------------------------------------------------
    candidates = [
        TripDispatchCandidate(
            tenant_id=tenant_id,
            trip_request_id=trip_req.trip_request_id,
            trip_batch_id=trip_batch.trip_batch_id,
            driver_id=driver_id,
            request_sent_at_utc=now,
        )
        for driver_id in available_driver_ids
    ]

    db.add_all(candidates)

    # ------------------------------------------------
    # 8️⃣ Update TripRequest status
    # ------------------------------------------------
    trip_req.status = "driver_searching"
    trip_req.updated_at_utc = now
    db.add(trip_req)

    db.commit()
    db.refresh(trip_batch)

    # ------------------------------------------------
    # 8️⃣ Notify drivers
    # ------------------------------------------------
    for driver_id in available_driver_ids:
        redis_client.publish(
            f"driver:trip_request:{driver_id}",
            json.dumps({"trip_request_id": trip_req.trip_request_id, "batch_id": trip_batch.trip_batch_id}),
        )

    return {
        "trip_request_id": trip_req.trip_request_id,
        "batch_id": trip_batch.trip_batch_id,
        "batch_number": batch_cfg["batch_number"],
        "drivers_notified": len(available_driver_ids),
        "status": "driver_search_started",
        "message": f"Notified {len(available_driver_ids)} drivers",
    }


# ============================================
# STATUS CHECK (for frontend polling)
# ============================================
# STATUS CHECK - FOR TRIP REQUEST (before driver accepts)
# ============================================
@router.get("/request/{trip_request_id}/status", response_model=TripStatusOut)
def get_trip_request_status(
    trip_request_id: int,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    """
    Get trip request status (before driver accepts).
    Once driver accepts and Trip is created, client should switch to /trips/{trip_id}/status
    """
    from app.core.redis import redis_client
    from app.models.core.drivers.drivers import Driver
    from app.models.core.users.user_profiles import UserProfile
    
    trip_req = db.query(TripRequest).filter(
        TripRequest.trip_request_id == trip_request_id,
        TripRequest.user_id == rider.user_id,
    ).first()

    if not trip_req:
        raise HTTPException(status_code=404, detail="Trip request not found")

    # Build response dict from trip_req
    out_dict = {
        "trip_request_id": trip_req.trip_request_id,
        "user_id": trip_req.user_id,
        "city_id": trip_req.city_id,
        "status": trip_req.status,
        "pickup_lat": trip_req.pickup_lat,
        "pickup_lng": trip_req.pickup_lng,
        "drop_lat": trip_req.drop_lat,
        "drop_lng": trip_req.drop_lng,
        "estimated_distance_km": trip_req.estimated_distance_km,
        "estimated_duration_minutes": trip_req.estimated_duration_minutes,
        "created_at_utc": trip_req.created_at_utc,
        "assigned_info": None,
        "otp": None,
    }

    # Check if trip was cancelled (even if trip_req.status is back to driver_searching)
    # This happens when driver cancels after accepting. Only report cancelled
    # if the cancellation happened after the trip_request was last updated —
    # this allows a subsequent `start-driver-search` (which updates trip_req)
    # to clear the cancelled flag for the rider.
    cancelled_trip = db.query(Trip).filter(
        Trip.trip_request_id == trip_request_id,
        Trip.trip_status == "cancelled",
    ).order_by(Trip.trip_id.desc()).first()

    if cancelled_trip:
        cancelled_at = getattr(cancelled_trip, "cancelled_at_utc", None)
        last_req_update = getattr(trip_req, "updated_at_utc", None) or getattr(trip_req, "created_at_utc", None)
        if cancelled_at and last_req_update and cancelled_at > last_req_update:
            out_dict["status"] = "cancelled"
            return TripStatusOut(**out_dict)

    # If driver assigned or trip in progress, enrich with trip/driver info
    if trip_req.status in ("driver_assigned", "in_progress"):
        print(f"[TRIP_STATUS_START] Querying for trip_request_id={trip_request_id}, status={trip_req.status}")
        trip = db.query(Trip).filter(Trip.trip_request_id == trip_request_id).first()
        print(f"[TRIP_STATUS_RESULT] trip_found={trip is not None}, trip_id={trip.trip_id if trip else 'N/A'}, driver_id={trip.driver_id if trip else 'N/A'}")
        if trip:
            assigned = {
                "trip_id": trip.trip_id,
                "driver_id": trip.driver_id,
                "driver_phone": None,
                "driver_name": None,
                "driver_rating_avg": None,
                "driver_rating_count": None,
                "vehicle_number": None,
                "vehicle_type": None,
                "driver_lat": None,
                "driver_lng": None,
                "eta_minutes": None,
            }

            # Lookup driver phone via User
            if trip.driver_id:
                driver = db.query(Driver).filter(Driver.driver_id == trip.driver_id).first()
                if driver:
                    user = db.query(User).filter(User.user_id == driver.user_id).first()
                    if user:
                        assigned["driver_phone"] = user.phone_e164
                    
                    # Get driver name from UserProfile
                    profile = db.query(UserProfile).filter(UserProfile.user_id == driver.user_id).first()
                    if profile:
                        assigned["driver_name"] = profile.full_name
                    
                    # Get driver rating
                    assigned["driver_rating_avg"] = driver.rating_avg
                    assigned["driver_rating_count"] = driver.rating_count

                    # Try to get driver GEO from Redis
                    try:
                        geo_key = f"drivers:geo:{trip.tenant_id}:{trip.city_id}"
                        pos = redis_client.geopos(geo_key, str(driver.driver_id))
                        if pos and pos[0]:
                            lng, lat = pos[0]
                            assigned["driver_lat"] = float(lat)
                            assigned["driver_lng"] = float(lng)

                            # Estimate ETA: distance / avg_speed (30 km/h)
                            dist_km = haversine_distance(
                                float(lat),
                                float(lng),
                                float(trip.pickup_latitude),
                                float(trip.pickup_longitude),
                            )
                            eta = int((dist_km / 30.0) * 60)
                            assigned["eta_minutes"] = eta
                    except Exception:
                        # best-effort -- do not fail status endpoint
                        pass
            
            # Lookup vehicle info
            if trip.vehicle_id:
                from app.models.core.vehicles.vehicles import Vehicle
                vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == trip.vehicle_id).first()
                if vehicle:
                    assigned["vehicle_number"] = vehicle.license_plate
                    assigned["vehicle_type"] = vehicle.category_code

            # attach assigned_info to the response dict
            out_dict["assigned_info"] = assigned
            
            # Try to fetch OTP from Redis using trip_id
            try:
                key = _otp_plain_key(trip.trip_id)
                otp = redis_client.get(key)
                # Handle both bytes and string returns from Redis
                if otp:
                    otp_val = otp.decode() if isinstance(otp, bytes) else otp
                    if otp_val:
                        out_dict['otp'] = otp_val
            except Exception as e:
                print(f"OTP fetch error: {e}")

    print(f"[TRIP_STATUS_RESPONSE] trip_request_id={trip_request_id}, assigned_info={out_dict.get('assigned_info')}, trip_id={out_dict.get('assigned_info', {}).get('trip_id') if isinstance(out_dict.get('assigned_info'), dict) else 'N/A'}")
    return TripStatusOut(**out_dict)


# ============================================
# STATUS CHECK - FOR TRIP (after driver accepts, use trip_id instead)
# ============================================
@router.get("/{trip_id}/status")
def get_trip_status_by_trip_id(
    trip_id: int,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    """
    Get trip status by trip_id (after driver accepts).
    
    🔒 STRICT OWNERSHIP: Only return if trip belongs to authenticated rider
    Include OTP if trip is in "assigned" status
    """
    from app.models.core.trips.trips import Trip
    from app.core.redis import redis_client
    from app.core.trips.trip_otp_service import _otp_plain_key

    trip = (
            db.query(Trip)
            .join(TripRequest, Trip.trip_request_id == TripRequest.trip_request_id)
            .filter(
                Trip.trip_id == trip_id,
                TripRequest.user_id == rider.user_id,  # STRICT OWNERSHIP
            )
            .first()
        )

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    response = {
        "trip_id": trip.trip_id,
        "status": trip.trip_status,
        "otp": None,
    }

    # OTP only valid before trip starts
    if trip.trip_status in ("assigned",):
        try:
            otp = redis_client.get(_otp_plain_key(trip_id))
            if otp:
                response["otp"] = otp.decode() if isinstance(otp, bytes) else otp
        except Exception:
            pass

    return response

# ================================================================
# DEV: Rider OTP retrieval & resend (only available when DEV_MODE=true)
# ================================================================
@router.get("/{trip_id}/otp", status_code=200)
def get_trip_otp(
    trip_id: int,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    """Return plaintext OTP for a trip when DEV_MODE is enabled (for testing)."""


    if os.environ.get("DEV_MODE", "false").lower() != "true":
        raise HTTPException(status_code=403, detail="OTP retrieval is disabled in production")

    # verify ownership
    trip = (
        db.query(Trip)
        .join(TripRequest, Trip.trip_request_id == TripRequest.trip_request_id)
        .filter(
            Trip.trip_id == trip_id,
            TripRequest.user_id == rider.user_id,
        )
        .first()
    )

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    # try to read plaintext OTP from redis
    try:
        from app.core.redis import redis_client
        key = _otp_plain_key(trip_id)
        otp = redis_client.get(key)
        otp = otp.decode() if otp else None
    except Exception:
        otp = None

    if not otp:
        raise HTTPException(status_code=404, detail="OTP not available or expired")

    return {"trip_id": trip_id, "otp": otp}


@router.post("/{trip_id}/resend-otp", status_code=200)
def resend_trip_otp(
    trip_id: int,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    """Regenerate & store OTP (dev) — in production this would trigger an SMS/notification."""
    import os
    from app.core.trips.trip_otp_service import generate_trip_otp, store_trip_otp

    if os.environ.get("DEV_MODE", "false").lower() != "true":
        raise HTTPException(status_code=403, detail="OTP resend is disabled in production")

    trip = (
            db.query(Trip)
            .join(TripRequest, Trip.trip_request_id == TripRequest.trip_request_id)
            .filter(
                Trip.trip_id == trip_id,
                TripRequest.user_id == rider.user_id,
            )
            .first()
        )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    # Get the associated trip to store OTP with trip_id
 

    otp = generate_trip_otp()
    store_trip_otp(trip.trip_id, otp)

    # In real system: send SMS to rider.phone_e164
    return {"trip_id": trip.trip_id, "message": "OTP regenerated and (dev) stored"}


# ================================================================
# CANCEL TRIP REQUEST (Before driver is assigned)
# ================================================================
@router.post("/{trip_request_id}/cancel", status_code=200)
def cancel_trip_request(
    trip_request_id: int,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    """
    Cancel trip request before driver is assigned.
    Allows rider to go back and select a different tenant.
    """
    import os
    from datetime import datetime, timezone
    
    trip_req = db.query(TripRequest).filter(
        TripRequest.trip_request_id == trip_request_id,
        TripRequest.user_id == rider.user_id,
    ).with_for_update().first()
    
    if not trip_req:
        raise HTTPException(status_code=404, detail="Trip request not found")
    
    # Can only cancel if not yet assigned to a driver
    if trip_req.status in ["driver_assigned", "completed", "cancelled"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel trip request in '{trip_req.status}' state"
        )
    
    # Mark as cancelled
    trip_req.status = "cancelled"
    trip_req.cancelled_at_utc = datetime.now(timezone.utc)
    db.add(trip_req)
    db.commit()
    
    print(f"[TRIP REQUEST CANCEL] trip_request_id={trip_request_id} cancelled by rider {rider.user_id}")
    
    return {
        "status": "cancelled",
        "trip_request_id": trip_request_id,
        "message": "Trip request cancelled. You can create a new one."
    }


# ============================================
# 🔁 CHANGE PROVIDER (RESET SELECTION)
# ============================================

@router.post("/{trip_request_id}/change-provider", status_code=200)
def change_provider(
    trip_request_id: int,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    """
    Reset tenant & vehicle selection so rider can choose a different provider.
    This is used when no drivers are found or rider wants to switch providers.
    """

    trip_req = (
        db.query(TripRequest)
        .filter(
            TripRequest.trip_request_id == trip_request_id,
            TripRequest.user_id == rider.user_id,
        )
        .with_for_update()
        .first()
    )

    if not trip_req:
        raise HTTPException(status_code=404, detail="Trip request not found")

    # Only allow change before driver assignment
    allowed_statuses = (
        "searching",
        "tenant_selected",
        "driver_searching",
        "no_drivers_available",
    )

    if trip_req.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change provider when trip status is '{trip_req.status}'",
        )

    # 🔄 Reset selection
    trip_req.selected_tenant_id = None
    trip_req.vehicle_category = None
    trip_req.status = "searching"
    trip_req.updated_at_utc = datetime.now(timezone.utc)

    db.add(trip_req)
    db.commit()

    return {
        "trip_request_id": trip_req.trip_request_id,
        "status": "searching",
        "message": "Provider selection reset. You can choose a different provider.",
    }
