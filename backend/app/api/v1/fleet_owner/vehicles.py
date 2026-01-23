from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner
from app.models.core.vehicles.vehicles import Vehicle
from app.schemas.core.vehicles.vehicles import VehicleCreate, VehicleOut

router = APIRouter(
    prefix="/vehicles",
    tags=["Fleet Owner – Vehicles"],
)
@router.post(
    "",
    response_model=VehicleOut,
)
def add_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    fleet = Depends(require_fleet_owner),
):
    print(fleet.fleet_owner_id)
    vehicle = Vehicle(
        tenant_id=fleet.tenant_id,          # 🔒 derived
        country_id=payload.country_id,
        owner_type="fleet_owner",
        fleet_owner_id=fleet.fleet_owner_id,
        category_code=payload.category_code,
        license_plate=payload.license_plate,
        model=payload.model,
        manufacture_year=payload.manufacture_year,
        status="inactive",                  # until tenant-admin approves
        created_by=fleet.user_id,
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return vehicle
@router.get(
    "",
    response_model=list[VehicleOut],
)
def list_vehicles(
    db: Session = Depends(get_db),
    fleet = Depends(require_fleet_owner),
):
    return (
        db.query(Vehicle)
        .filter(
            Vehicle.fleet_owner_id == fleet.fleet_owner_id,
            Vehicle.tenant_id == fleet.tenant_id,
        )
        .all()
    )
