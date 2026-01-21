from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.core.vehicles.vehicles import Vehicle
from app.schemas.core.vehicles.vehicles import VehicleCreate
from app.schemas.core.vehicles.vehicles import VehicleOut
from app.core.security.roles import require_driver

router = APIRouter(
    prefix="/driver/vehicles",
    tags=["Driver – Vehicles"],
)
@router.post("", response_model=VehicleOut)
def add_vehicle_by_driver(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    # 1️⃣ Prevent duplicate vehicle (license plate uniqueness safety)
    existing = (
        db.query(Vehicle)
        .filter(
            Vehicle.country_id == payload.country_id,
            Vehicle.license_plate == payload.license_plate,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Vehicle with this license plate already exists",
        )

    # 2️⃣ Create vehicle owned by driver
    vehicle = Vehicle(
        tenant_id=driver.tenant_id,
        country_id=payload.country_id,

        owner_type="driver",
        driver_owner_id=driver.driver_id,
        fleet_owner_id=None,

        category_code=payload.category_code,
        license_plate=payload.license_plate,
        model=payload.model,
        manufacture_year=payload.manufacture_year,

        # IMPORTANT: not usable until approved
        status="inactive",

        created_by=driver.user_id,
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return vehicle
