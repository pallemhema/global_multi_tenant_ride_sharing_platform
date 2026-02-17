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

from app.models.core.trips.trip_request import TripRequest
from app.models.core.trips.trips import Trip
from app.models.core.drivers.drivers import Driver
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.models.core.fleet_owners.driver_vehicle_assignments import DriverVehicleAssignment
from app.models.core.vehicles.vehicles import Vehicle
from app.core.redis import redis_client

class TripLifecycle:
    """
    Central orchestrator for trip lifecycle.
    """

 
   

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
        ).with_for_update().first()

        if status:
            status.runtime_status = "available"
            status.current_trip_id = None
            status.last_updated_utc = datetime.now(timezone.utc)
            db.add(status)

            # ✅ UPDATE REDIS RUNTIME IMMEDIATELY
            redis_client.setex(
                f"driver:runtime:{driver_id}",
                60,
                "available",
            )

