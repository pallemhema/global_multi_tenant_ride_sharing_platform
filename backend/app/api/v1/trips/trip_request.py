# app/api/v1/trips/trip_request.py
"""
Trip Request Endpoints - Multi-tenant ride-sharing trip flow

1️⃣ Create Trip Request (rider)
2️⃣ List Available Tenants & Pricing
3️⃣ Select Tenant (rider)
4️⃣ Start Driver Search (batch-wise)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import math

from app.core.dependencies import get_db
from app.core.security.roles import require_rider
from app.models.core.riders.riders import Rider
from app.models.core.tenants.tenants import Tenant
from app.models.core.tenants.tenant_cities import TenantCity
from app.models.lookups.city import City
from app.models.core.trips.trip_request import TripRequest
from app.schemas.core.trips.trip_request import (
    TripRequestCreate,
    TripRequestOut,
    AvailableTenantsListOut,
    TenantAvailabilityInfo,
    VehiclePricingInfo,
    TenantSelectionPayload,
    TenantSelectionResponse,
)

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
    rider: Rider = Depends(require_rider),
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
    
    # ====== Resolve city from pickup coordinates ======
    # Find city closest to pickup location
    city = (
        db.query(City)
        .filter(City.is_active.is_(True))
        .all()
    )
    
    closest_city = None
    min_distance = float('inf')
    
    for c in city:
        if c.latitude is None or c.longitude is None:
            continue
        
        dist = haversine_distance(
            payload.pickup_lat,
            payload.pickup_lng,
            float(c.latitude),
            float(c.longitude)
        )
        
        if dist < min_distance:
            min_distance = dist
            closest_city = c
    
    if not closest_city or min_distance > 50:  # Within 50km of a city
        raise HTTPException(
            status_code=400,
            detail="Service not available in your location"
        )
    
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
        rider_id=rider.rider_id,
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
    rider: Rider = Depends(require_rider),
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
        TripRequest.rider_id == rider.rider_id,
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
        
        # TODO: Get vehicle pricing from TenantVehiclePricing table
        # For now, return empty vehicles list as placeholder
        vehicles = []
        
        if not vehicles:
            continue
        
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
    rider: Rider = Depends(require_rider),
):
    """
    STEP 3: Rider selects a tenant and vehicle category.
    
    After this:
    - TripRequest.status = "tenant_selected"
    - Backend will search for drivers ONLY from selected tenant
    - No cross-tenant driver search
    
    Returns: Confirmation of selection
    """
    
    # ====== Get trip request ======
    trip_req = db.query(TripRequest).filter(
        TripRequest.trip_request_id == trip_request_id,
        TripRequest.rider_id == rider.rider_id,
    ).first()
    
    if not trip_req:
        raise HTTPException(status_code=404, detail="Trip request not found")
    
    if trip_req.status != "searching":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot select tenant when trip status is {trip_req.status}"
        )
    
    # ====== Verify tenant operates in city ======
    tenant_city = (
        db.query(TenantCity)
        .filter(
            TenantCity.tenant_id == payload.tenant_id,
            TenantCity.city_id == trip_req.city_id,
            TenantCity.is_active.is_(True),
        )
        .first()
    )
    
    if not tenant_city:
        raise HTTPException(
            status_code=400,
            detail="Selected tenant does not operate in this city"
        )
    
    # TODO: Verify vehicle category exists in TenantVehiclePricing table
    
    # ====== Update TripRequest ======
    trip_req.selected_tenant_id = payload.tenant_id
    trip_req.status = "tenant_selected"
    trip_req.updated_at_utc = datetime.now(timezone.utc)
    
    db.add(trip_req)
    db.commit()
    db.refresh(trip_req)
    
    return TenantSelectionResponse(
        trip_request_id=trip_req.trip_request_id,
        status="tenant_selected",
        selected_tenant_id=trip_req.selected_tenant_id,
        vehicle_category=payload.vehicle_category,
        message=f"Searching for {payload.vehicle_category} drivers...",
    )


# ============================================
# 4️⃣ START BATCH-WISE DRIVER SEARCH
# ============================================

BATCH_CONFIG = [
    {"batch_number": 1, "radius_km": 3.0, "max_drivers": 5, "timeout_sec": 15},
    {"batch_number": 2, "radius_km": 6.0, "max_drivers": 8, "timeout_sec": 20},
    {"batch_number": 3, "radius_km": 10.0, "max_drivers": 12, "timeout_sec": 25},
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
    rider: Rider = Depends(require_rider),
):
    """
    STEP 4: Start batch-wise driver search after tenant selection.
    
    Algorithm:
    1. Get nearby drivers from Redis GEO (within search radius)
    2. Sort by distance (nearest first)
    3. Split into batches (e.g., 3-5 drivers per batch)
    4. Create TripBatch and TripCandidate records
    5. Notify drivers in batch via Redis pub/sub
    6. Wait for response window (timeout)
    7. On success: Create Trip record, stop further batches
    8. On timeout: Move to next batch
    9. If all exhausted: Mark as "no_drivers_available"
    
    Returns: Batch info with number of drivers notified
    """
    from app.models.core.trips.trip_batch import TripBatch
    from app.models.core.trips.trip_dispatch_candidates import TripDispatchCandidate
    from app.core.redis import redis_client
    
    # ====== Get trip request ======
    trip_req = db.query(TripRequest).filter(
        TripRequest.trip_request_id == trip_request_id,
        TripRequest.rider_id == rider.rider_id,
    ).first()
    
    if not trip_req:
        raise HTTPException(status_code=404, detail="Trip request not found")
    
    if trip_req.status != "tenant_selected":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot search drivers when trip status is {trip_req.status}"
        )
    
    if not trip_req.selected_tenant_id:
        raise HTTPException(
            status_code=400,
            detail="No tenant selected"
        )
    
    now = datetime.now(timezone.utc)
    tenant_id = trip_req.selected_tenant_id
    city_id = trip_req.city_id
    
    # ====== Start with first batch config ======
    batch_cfg = BATCH_CONFIG[0]
    
    # ====== Fetch nearby drivers from Redis GEO ======
    geo_key = f"drivers:geo:{tenant_id}:{city_id}"
    
    # Query Redis GEO for drivers within search radius
    nearby_drivers = redis_client.georadius(
        geo_key,
        trip_req.pickup_lng,
        trip_req.pickup_lat,
        radius=batch_cfg["radius_km"],
        unit="km",
        count=batch_cfg["max_drivers"],
        sort="ASC",
        withcoord=False,
    )
    
    if not nearby_drivers:
        raise HTTPException(
            status_code=404,
            detail="No drivers available in your area"
        )
    
    # Convert to driver IDs (may be bytes or strings from Redis)
    driver_ids = [
        int(d.decode() if isinstance(d, bytes) else d)
        for d in nearby_drivers
    ]
    
    # Filter for online/available drivers
    available_drivers = []
    for driver_id in driver_ids:
        status_key = f"driver:status:{driver_id}"
        online = redis_client.hget(status_key, "is_online")
        runtime_status = redis_client.hget(status_key, "runtime_status")
        
        # Only include if online and idle
        if online == b"true" and runtime_status == b"idle":
            available_drivers.append(driver_id)
    
    if not available_drivers:
        raise HTTPException(
            status_code=404,
            detail="No available drivers in your area"
        )
    
    # ====== Create TripBatch ======
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
    
    # ====== Create TripCandidate records ======
    candidates = [
        TripDispatchCandidate(
            tenant_id=tenant_id,
            trip_id=None,  # Not yet assigned
            round_id=trip_batch.trip_batch_id,  # Using batch ID as round
            driver_id=driver_id,
            request_sent_at_utc=now,
        )
        for driver_id in available_drivers
    ]
    db.add_all(candidates)
    
    # ====== Update TripRequest status ======
    trip_req.status = "driver_searching"
    trip_req.updated_at_utc = now
    db.add(trip_req)
    
    db.commit()
    db.refresh(trip_batch)
    
    # ====== Notify drivers (Redis pub/sub) ======
    # In production, use WebSocket/push notifications
    for driver_id in available_drivers:
        channel = f"driver:trip_request:{driver_id}"
        redis_client.publish(
            channel,
            f"{{'trip_request_id': {trip_req.trip_request_id}, 'batch_id': {trip_batch.trip_batch_id}}}"
        )
    
    return {
        "trip_request_id": trip_req.trip_request_id,
        "batch_id": trip_batch.trip_batch_id,
        "batch_number": batch_cfg["batch_number"],
        "drivers_notified": len(available_drivers),
        "status": "driver_search_started",
        "message": f"Notified {len(available_drivers)} drivers in batch {batch_cfg['batch_number']}",
    }
