"""
Driver Eligibility Filter - Step 5 of Trip Lifecycle

Validates that a driver satisfies ALL 9 conditions before receiving a trip request.
"""

from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.core.drivers.drivers import Driver
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.models.core.vehicles.vehicles import Vehicle


class DriverEligibility:
    """
    Check if driver is eligible for trip dispatch.
    """

    @staticmethod
    def is_eligible(
        db: Session,
        driver_id: int,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
    ) -> bool:
        """
        Return True if driver satisfies ALL 9 conditions.
        """
        return DriverEligibility.check_all_conditions(
            db=db,
            driver_id=driver_id,
            tenant_id=tenant_id,
            city_id=city_id,
            vehicle_category=vehicle_category,
        )

    @staticmethod
    def check_all_conditions(
        db: Session,
        driver_id: int,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
    ) -> bool:
        """
        Verify all 9 conditions:
        1. Belongs to tenant
        2. Is approved driver
        3. Is active driver
        4. Shift status = online
        5. Runtime status = available
        6. City matches
        7. Has vehicle of category (active + docs approved)
        8. Full KYC approved
        9. Not already in another dispatch round
        """

        # Condition 1-3, 6, 8: Driver attributes
        driver = db.query(Driver).filter(
            Driver.driver_id == driver_id,
            Driver.tenant_id == tenant_id,
            Driver.home_city_id == city_id,
            Driver.is_active.is_(True),
            Driver.approval_status == "approved",
            Driver.kyc_status == "approved",
        ).first()

        if not driver:
            return False

        # Condition 4-5: Runtime status
        status = db.query(DriverCurrentStatus).filter(
            DriverCurrentStatus.driver_id == driver_id,
            DriverCurrentStatus.is_online.is_(True),
            DriverCurrentStatus.runtime_status == "available",
        ).first()

        if not status:
            return False

        # Condition 7: Has active vehicle of category with approved docs
        vehicle = db.query(Vehicle).filter(
            Vehicle.driver_id == driver_id,
            Vehicle.vehicle_category == vehicle_category,
            Vehicle.is_active.is_(True),
            Vehicle.document_status == "approved",
        ).first()

        if not vehicle:
            return False

        # Condition 9: Not already in dispatch round
        # Check if driver already has a current_trip_id
        if status.current_trip_id:
            return False

        return True

    @staticmethod
    def get_eligible_drivers(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
    ) -> list[dict]:
        """
        Fetch all drivers eligible for trip.

        Returns list of dicts with driver_id, vehicle_id, vehicle_plate.
        """
        from app.models.core.driver_vehicles import DriverVehicle

        eligible_drivers = []

        # Get all drivers of tenant in city with approved KYC + active status
        drivers = db.query(Driver).filter(
            Driver.tenant_id == tenant_id,
            Driver.home_city_id == city_id,
            Driver.is_active.is_(True),
            Driver.approval_status == "approved",
            Driver.kyc_status == "approved",
        ).all()

        for driver in drivers:
            # Check runtime status
            status = db.query(DriverCurrentStatus).filter(
                DriverCurrentStatus.driver_id == driver.driver_id,
                DriverCurrentStatus.is_online.is_(True),
                DriverCurrentStatus.runtime_status == "available",
                DriverCurrentStatus.current_trip_id.is_(None),
            ).first()

            if not status:
                continue

            # Check vehicle
            vehicle = db.query(Vehicle).filter(
                Vehicle.driver_id == driver.driver_id,
                Vehicle.vehicle_category == vehicle_category,
                Vehicle.is_active.is_(True),
                Vehicle.document_status == "approved",
            ).first()

            if not vehicle:
                continue

            eligible_drivers.append({
                "driver_id": driver.driver_id,
                "vehicle_id": vehicle.vehicle_id,
                "vehicle_plate": vehicle.plate_number,
                "vehicle_category": vehicle.vehicle_category,
                "rating": driver.rating_avg or 0.0,
                "acceptance_rate": driver.acceptance_rate or 0.0,
            })

        return eligible_drivers
