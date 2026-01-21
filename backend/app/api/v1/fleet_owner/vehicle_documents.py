# app/api/v1/fleet_owner/vehicle_documents.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner_active
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.vehicles.vehicle_docuemnts import VehicleDocument
from app.schemas.core.vehicles.vehicle_documents import (
    VehicleDocumentCreate,
    VehicleDocumentOut,
)

router = APIRouter(
    prefix="/fleet-owner",
    tags=["Fleet Owner – Vehicle Documents"],
)


# 📄 Upload vehicle document
@router.post(
    "/vehicles/{vehicle_id}/documents",
    response_model=VehicleDocumentOut,
)
def upload_vehicle_document(
    vehicle_id: int,
    payload: VehicleDocumentCreate,
    db: Session = Depends(get_db),
    fleet = Depends(require_fleet_owner_active),
):
    if not fleet.is_active:
        raise HTTPException(403, "Fleet owner not approved")

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.vehicle_id == vehicle_id,
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(404, "Vehicle not found")

    doc = VehicleDocument(
        vehicle_id=vehicle.vehicle_id,
        tenant_id = fleet.tenant_id,
        document_type=payload.document_type,
        document_number=payload.document_number,
        document_url=payload.document_url,
        expiry_date=payload.expiry_date,
        created_by=fleet.user_id,
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc


# 📋 List vehicle documents
@router.get(
    "/vehicles/{vehicle_id}/documents",
    response_model=list[VehicleDocumentOut],
)
def list_vehicle_documents(
    vehicle_id: int,
    db: Session = Depends(get_db),
    fleet = Depends(require_fleet_owner_active),
):
    return (
        db.query(VehicleDocument)
        .join(Vehicle)
        .filter(
            Vehicle.vehicle_id == vehicle_id,
        )
        .all()
    )
