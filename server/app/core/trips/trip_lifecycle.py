"""
Trip Lifecycle Service - Core orchestration for entire trip flow

Supports:
- Individual drivers (own vehicles)
- Fleet drivers (assigned vehicles)

Vehicle source of truth:
1. Individual driver  → vehicles.driver_owner_id
2. Fleet driver       → driver_vehicle_assignments
"""

from decimal import Decimal
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Dict

from app.core.redis import redis_client

from app.models.core.users.users import User
from app.models.core.trips.trip_request import TripRequest
from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_batch import TripBatch
from app.models.core.drivers.drivers import Driver
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.models.core.fleet_owners.driver_vehicle_assignments import DriverVehicleAssignment
from app.models.core.tenants.tenants import Tenant
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.tenants.tenant_cities import TenantCity


class TripLifecycle:
    """
    Central orchestrator for trip lifecycle.
    """

    # =========================================================
    # STEP 0: VALIDATIONS
    # =========================================================

    @staticmethod
    def validate_rider_state(db: Session, user_id: int) -> bool:
        return db.query(User).filter(
            User.user_id == user_id,
            User.is_active.is_(True),
        ).first() is not None

    @staticmethod
    def validate_driver_state(
        db: Session,
        driver_id: int,
        tenant_id: int,
        city_id: int,
    ) -> Driver | None:
        driver = db.query(Driver).filter(
            Driver.driver_id == driver_id,
            Driver.tenant_id == tenant_id,
            Driver.city_id == city_id,
            Driver.is_active.is_(True),
            Driver.kyc_status == "approved",
        ).first()

        if not driver:
            return None

        status = db.query(DriverCurrentStatus).filter(
            DriverCurrentStatus.driver_id == driver_id,
            DriverCurrentStatus.is_online.is_(True),
            DriverCurrentStatus.runtime_status == "available",
        ).first()

        return driver if status else None

    @staticmethod
    def validate_tenant_state(db: Session, tenant_id: int, city_id: int) -> bool:
        tenant = db.query(Tenant).filter(
            Tenant.tenant_id == tenant_id,
            Tenant.status == "active",
            Tenant.approval_status == "approved",
        ).first()

        if not tenant:
            return False

        return db.query(TenantCity).filter(
            TenantCity.tenant_id == tenant_id,
            TenantCity.city_id == city_id,
            TenantCity.is_active.is_(True),
        ).first() is not None

    # =========================================================
    # VEHICLE RESOLUTION (INDIVIDUAL + FLEET)
    # =========================================================

    @staticmethod
    def resolve_active_vehicle(
        db: Session,
        driver_id: int,
        tenant_id: int,
        vehicle_category: str | None = None,
    ) -> Dict | None:
        """
        Resolve driver's active vehicle.

        If `vehicle_category` is None, return any active vehicle (individual-owned or fleet-assigned)
        prioritizing the driver's own vehicle first.
        """

        # --- Individual driver owns vehicle ---
        q = db.query(Vehicle).filter(
            Vehicle.driver_owner_id == driver_id,
            Vehicle.tenant_id == tenant_id,
            Vehicle.owner_type == "driver",
            Vehicle.status == "active",
        )
        if vehicle_category:
            q = q.filter(Vehicle.category_code == vehicle_category)

        vehicle = q.first()

        if vehicle:
            return {
                "vehicle_id": vehicle.vehicle_id,
                "category": vehicle.category_code,
                "license_plate": vehicle.license_plate,
                "ownership": "individual",
            }

        # --- Fleet driver assigned vehicle ---
        q2 = db.query(DriverVehicleAssignment).join(
            Vehicle,
            DriverVehicleAssignment.vehicle_id == Vehicle.vehicle_id,
        ).filter(
            DriverVehicleAssignment.driver_id == driver_id,
            DriverVehicleAssignment.tenant_id == tenant_id,
            DriverVehicleAssignment.is_active.is_(True),
            Vehicle.owner_type == "fleet_owner",
            Vehicle.status == "active",
        )
        if vehicle_category:
            q2 = q2.filter(Vehicle.category_code == vehicle_category)

        assignment = q2.first()

        if assignment:
            # Query the vehicle using the vehicle_id from assignment
            vehicle = db.query(Vehicle).filter(
                Vehicle.vehicle_id == assignment.vehicle_id
            ).first()
            
            if vehicle:
                return {
                    "vehicle_id": vehicle.vehicle_id,
                    "category": vehicle.category_code,
                    "license_plate": vehicle.license_plate,
                    "ownership": "fleet",
                }

        return None

    # =========================================================
    # STEP 5: FETCH ELIGIBLE DRIVERS
    # =========================================================

    @staticmethod
    def fetch_eligible_drivers(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
    ) -> List[Dict]:
        drivers = db.query(Driver).join(
            DriverCurrentStatus,
            Driver.driver_id == DriverCurrentStatus.driver_id,
        ).filter(
            Driver.tenant_id == tenant_id,
            Driver.city_id == city_id,
            Driver.is_active.is_(True),
            Driver.kyc_status == "approved",
            DriverCurrentStatus.is_online.is_(True),
            DriverCurrentStatus.runtime_status == "available",
        ).all()

        eligible = []

        for driver in drivers:
            vehicle = TripLifecycle.resolve_active_vehicle(
                db=db,
                driver_id=driver.driver_id,
                tenant_id=tenant_id,
                vehicle_category=vehicle_category,
            )

            if not vehicle:
                continue

            eligible.append({
                "driver_id": driver.driver_id,
                "vehicle_id": vehicle["vehicle_id"],
                "license_plate": vehicle["license_plate"],
                "ownership": vehicle["ownership"],
            })

        return eligible

    # =========================================================
    # STEP 6: GEO SORTING
    # =========================================================

    @staticmethod
    def sort_drivers_by_proximity(
        tenant_id: int,
        city_id: int,
        pickup_lat: float,
        pickup_lng: float,
        driver_ids: List[int],
        radius_km: float = 10.0,
    ) -> List[Dict]:

        geo_key = f"drivers:geo:{tenant_id}:{city_id}"

        nearby = redis_client.georadius(
            geo_key,
            pickup_lng,
            pickup_lat,
            radius=radius_km,
            unit="km",
            sort="ASC",
            withdist=True,
        )

        results = []

        for raw in nearby:
            driver_id_raw, dist = raw
            driver_id = int(driver_id_raw.decode() if isinstance(driver_id_raw, bytes) else driver_id_raw)

            if driver_id in driver_ids:
                results.append({
                    "driver_id": driver_id,
                    "distance_km": float(dist),
                })

        return results

    # =========================================================
    # STEP 9: CREATE TRIP
    # =========================================================

    @staticmethod
    def create_trip_from_request(
        db: Session,
        trip_request: TripRequest,
        driver: Driver,
        vehicle_category: str | None = None,
        now: datetime | None = None,
    ) -> Trip:

        if not now:
            now = datetime.now(timezone.utc)

        vehicle = TripLifecycle.resolve_active_vehicle(
            db=db,
            driver_id=driver.driver_id,
            tenant_id=trip_request.selected_tenant_id,
            vehicle_category=vehicle_category,
        )

        if not vehicle:
            raise HTTPException(
                status_code=409,
                detail="Driver has no active vehicle",
            )

        trip = Trip(
            trip_request_id=trip_request.trip_request_id,
            tenant_id=trip_request.selected_tenant_id,
            driver_id=driver.driver_id,
            vehicle_id=vehicle["vehicle_id"],
            city_id=trip_request.city_id,
            trip_status="assigned",
            requested_at_utc=trip_request.created_at_utc,
            assigned_at_utc=now,
            distance_km=trip_request.estimated_distance_km,
            duration_minutes=trip_request.estimated_duration_minutes,
            selected_vehicle_category=vehicle.get("category")
        )

        db.add(trip)
        db.flush()

        return trip

    # =========================================================
    # DRIVER LOCK / RELEASE
    # =========================================================

    @staticmethod
    def lock_driver(db: Session, driver_id: int, trip_id: int):
        status = db.query(DriverCurrentStatus).filter(
            DriverCurrentStatus.driver_id == driver_id,
        ).with_for_update().first()

        if status:
            status.runtime_status = "trip_accepted"
            status.current_trip_id = trip_id
            status.last_updated_utc = datetime.now(timezone.utc)
            db.add(status)

    @staticmethod
    def release_driver(db: Session, driver_id: int):
        status = db.query(DriverCurrentStatus).filter(
            DriverCurrentStatus.driver_id == driver_id,
        ).first()

        if status:
            status.runtime_status = "available"
            status.current_trip_id = None
            status.last_updated_utc = datetime.now(timezone.utc)
            db.add(status)
