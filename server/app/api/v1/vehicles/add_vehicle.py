
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from datetime import date
import shutil
import os

from app.core.dependencies import get_db
from app.core.security.roles import require_vehicle_owner
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.drivers.drivers import Driver
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.schemas.core.vehicles.vehicles import VehicleCreate
from app.schemas.core.vehicles.vehicles import VehicleOut, VehicleUpdate

router = APIRouter()


# def create_vehicle(
#     payload: VehicleCreate,
#     db: Session = Depends(get_db),
#     owner=Depends(require_vehicle_owner),
# ):
#     # Check KYC approval for drivers creating vehicles
#     if owner["type"] == "driver":
#         driver = db.query(Driver).filter(
#             Driver.driver_id == owner["id"]
#         ).first()
#         if not driver or driver.kyc_status != "approved":
#             raise HTTPException(403, "KYC approval required to create vehicles")
    
#     # Check approval status for fleet owners creating vehicles
#     if owner["type"] == "fleet_owner":
#         fleet = db.query(FleetOwner).filter(
#             FleetOwner.fleet_owner_id == owner["id"]
#         ).first()
#         if not fleet or fleet.approval_status != "approved":
#             raise HTTPException(403, "Fleet owner approval required to create vehicles")
    
#     vehicle = Vehicle(
#         tenant_id=owner["tenant_id"],
#         owner_type=owner["type"],

#         driver_owner_id=(
#             owner["id"] if owner["type"] == "driver" else None
#         ),
#         fleet_owner_id=(
#             owner["id"] if owner["type"] == "fleet_owner" else None
#         ),

#         license_plate=payload.license_plate,
#         category_code=payload.category_code,
#         model=payload.model,
#         manufacture_year=payload.manufacture_year,

#         status="inactive",
#         created_by=owner["user_id"],
#     )

#     db.add(vehicle)
#     db.commit()
#     db.refresh(vehicle)

#     return vehicle
@router.post("/vehicles/add", response_model=VehicleOut)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    owner=Depends(require_vehicle_owner),
):
    print(owner["type"])
    # ================= DRIVER =================
    if owner["type"] == "driver":
        driver = (
            db.query(Driver)
            .filter(Driver.driver_id == owner["id"])
            .first()
        )

        if not driver:
            raise HTTPException(404, "Driver not found")

        if driver.driver_type != "individual":
            raise HTTPException(
                status_code=403,
                detail="Fleet drivers cannot add vehicles. Vehicles must be added by fleet owners."
            )

        if driver.kyc_status != "approved":
            raise HTTPException(
                status_code=403,
                detail="Driver KYC must be approved to add vehicles"
            )

    # ================= FLEET OWNER =================
    elif owner["type"] == "fleet_owner":
        fleet = (
            db.query(FleetOwner)
            .filter(FleetOwner.fleet_owner_id == owner["id"])
            .first()
        )

        if not fleet:
            raise HTTPException(404, "Fleet owner not found")

        if fleet.approval_status != "approved":
            raise HTTPException(
                status_code=403,
                detail="Fleet owner approval required to add vehicles"
            )

    else:
        raise HTTPException(403, "Invalid vehicle owner type")

    # ================= CREATE VEHICLE =================
    vehicle = Vehicle(
        tenant_id=owner["tenant_id"],
        owner_type=owner["type"],
        driver_owner_id=(
            owner["id"] if owner["type"] == "driver" else None
        ),
        fleet_owner_id=(
            owner["id"] if owner["type"] == "fleet_owner" else None
        ),
        license_plate=payload.license_plate,
        category_code=payload.category_code,
        model=payload.model,
        manufacture_year=payload.manufacture_year,

        status="inactive",
        created_by=owner["user_id"],
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return vehicle

# @router.get("/vehicles", response_model=list[VehicleOut])
# def list_vehicles(
#     db: Session = Depends(get_db),
#     owner=Depends(require_vehicle_owner),
# ):
#     query = db.query(Vehicle).filter(
#         Vehicle.tenant_id == owner["tenant_id"]
#     )

#     if owner["type"] == "driver":
#         query = query.filter(Vehicle.driver_owner_id == owner["id"])

#     if owner["type"] == "fleet_owner":
#         query = query.filter(Vehicle.fleet_owner_id == owner["id"])

#     return query.all()

@router.get("/vehicles", response_model=list[VehicleOut])
def list_vehicles(
    db: Session = Depends(get_db),
    owner=Depends(require_vehicle_owner),
):
    query = db.query(Vehicle).filter(
        Vehicle.tenant_id == owner["tenant_id"],
        Vehicle.owner_type == owner["type"],
    )

    if owner["type"] == "driver":
        query = query.filter(
            Vehicle.driver_owner_id == owner["id"]
        )

    elif owner["type"] == "fleet_owner":
        query = query.filter(
            Vehicle.fleet_owner_id == owner["id"]
        )

    else:
        raise HTTPException(403, "Invalid vehicle owner type")

    return query.all()


@router.delete("/vehicles/{vehicle_id}/delete", status_code=204)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    owner=Depends(require_vehicle_owner),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id,
        Vehicle.tenant_id == owner["tenant_id"],
    ).first()

    if not vehicle:
        raise HTTPException(404)

    if vehicle.owner_type != owner["type"]:
        raise HTTPException(403)

    if owner["type"] == "driver" and vehicle.driver_owner_id != owner["id"]:
        raise HTTPException(403)

    if owner["type"] == "fleet_owner" and vehicle.fleet_owner_id != owner["id"]:
        raise HTTPException(403)

    db.delete(vehicle)
    db.commit()

@router.put(
    "/vehicles/{vehicle_id}/edit",
    response_model=VehicleOut,
)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    owner=Depends(require_vehicle_owner),
):
    # 🔍 Fetch vehicle (ownership + tenant safe)
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.vehicle_id == vehicle_id,
            Vehicle.tenant_id == owner["tenant_id"],
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(404, "Vehicle not found")

    # 🔐 Ownership check
    if owner["type"] == "driver":
        if vehicle.driver_owner_id != owner["id"]:
            raise HTTPException(403, "Not your vehicle")

    if owner["type"] == "fleet_owner":
        if vehicle.fleet_owner_id != owner["id"]:
            raise HTTPException(403, "Not your vehicle")

    # ✏️ Apply updates (only provided fields)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(vehicle, field, value)

    # 🚨 Important: reset approval if edited
    vehicle.status = "inactive"

    db.commit()
    db.refresh(vehicle)

    return vehicle
