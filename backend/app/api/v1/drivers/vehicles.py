from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.drivers.driver_vehicle_assignments import DriverVehicleAssignment

router = APIRouter(
    prefix="/driver/vehicles",
    tags=["Driver – Vehicles"],
)
@router.get("/summary")
def driver_vehicle_summary(
    db: Session = Depends(get_db),
    driver: dict = Depends(require_driver),
):
    driver_id = driver.driver_id
    driver_type = driver.driver_type

    # ---------------- INDIVIDUAL DRIVER ----------------
    if driver_type == "individual":
        total = (
            db.query(func.count(Vehicle.vehicle_id))
            .filter(
                Vehicle.driver_owner_id == driver_id,
            )
            .scalar()
        )

        active = (
            db.query(func.count(Vehicle.vehicle_id))
            .filter(
                Vehicle.driver_owner_id == driver_id,
                Vehicle.status == "active",
            )
            .scalar()
        )
        print(active)

        return {
            "total_vehicles": total,
            "active_vehicles": active,
            "can_start_shift": active > 0,
        }

    # ---------------- FLEET DRIVER ----------------
    if driver_type == "fleet_driver":
        assigned = (
            db.query(func.count(DriverVehicleAssignment.vehicle_id))
            .filter(
                DriverVehicleAssignment.driver_id == driver_id,
                DriverVehicleAssignment.is_active.is_(True),
            )
            .scalar()
        )

        return {
            "total_vehicles": assigned,
            "active_vehicles": assigned,
            "can_start_shift": assigned > 0,
        }

    # ---------------- FALLBACK ----------------
    return {
        "total_vehicles": 0,
        "active_vehicles": 0,
        "can_start_shift": False,
    }
