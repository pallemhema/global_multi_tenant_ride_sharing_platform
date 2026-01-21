from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db

from app.core.security.roles import require_tenant_admin

from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.core.vehicles.vehicles import Vehicle

router = APIRouter(
    prefix="/tenants",
    tags=["fleet owners ,drivers and  vehicles approve"],
)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.core.fleet_owners.fleet_owner_documents import FleetOwnerDocument
from app.models.lookups.fleet_document_type import FleetDocumentType
from app.models.lookups.vehicle_document_type import VehicleDocumentType
from app.models.core.vehicles.vehicle_docuemnts import VehicleDocument

router = APIRouter(
    prefix="/tenants",
    tags=["Tenant Admin – Fleet Owner Approval"],
)


@router.post("/{tenant_id}/fleet-owners/{fleet_owner_id}/approve")
def approve_fleet_owner(
    tenant_id: int,
    fleet_owner_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    fleet = (
        db.query(FleetOwner)
        .filter(
            FleetOwner.fleet_owner_id == fleet_owner_id,
            FleetOwner.tenant_id == tenant_id,
        )
        .first()
    )

    if not fleet:
        raise HTTPException(404, "Fleet owner not found")

    if fleet.approval_status == "approved":
        raise HTTPException(400, "Fleet owner already approved")

    # 1️⃣ Mandatory document types
    mandatory_docs = (
        db.query(FleetDocumentType.document_code)
        .filter(FleetDocumentType.is_mandatory.is_(True))
        .all()
    )
    mandatory_codes = {d.document_code for d in mandatory_docs}

    # 2️⃣ Fleet owner documents
    docs = (
        db.query(FleetOwnerDocument)
        .filter(
            FleetOwnerDocument.tenant_id == tenant_id,
            FleetOwnerDocument.fleet_owner_id == fleet_owner_id,
        )
        .all()
    )

    uploaded_codes = {d.document_type for d in docs}

    # 3️⃣ Missing check
    missing = mandatory_codes - uploaded_codes
    if missing:
        raise HTTPException(
            400,
            {
                "message": "Mandatory documents missing",
                "missing_documents": list(missing),
            },
        )

    # 4️⃣ Approve all documents
    for doc in docs:
        doc.verification_status = "approved"
        doc.verified_by = int(user["sub"])
        doc.verified_at_utc = datetime.now(timezone.utc)

    # 5️⃣ Approve fleet owner
    fleet.approval_status = "approved"
    fleet.is_active = True
    fleet.approved_at_utc = datetime.now(timezone.utc)

    db.commit()

    return {
        "status": "fleet owner approved",
        "fleet_owner_id": fleet_owner_id,
        "documents_approved": len(docs),
    }



router = APIRouter(
    prefix="/tenants",
    tags=["Tenant Admin – Vehicle Approval"],
)


@router.post("/{tenant_id}/vehicles/{vehicle_id}/approve")
def approve_vehicle(
    tenant_id: int,
    vehicle_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    # 1️⃣ Fetch vehicle (tenant-safe)
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.vehicle_id == vehicle_id,
            Vehicle.tenant_id == tenant_id,
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(404, "Vehicle not found")

    if vehicle.status == "active":
        raise HTTPException(400, "Vehicle already approved")

    # 2️⃣ Mandatory document types
    mandatory_docs = (
        db.query(VehicleDocumentType.document_code)
        .filter(VehicleDocumentType.is_mandatory.is_(True))
        .all()
    )
    mandatory_codes = {d.document_code for d in mandatory_docs}

    # 3️⃣ Uploaded documents
    uploaded_docs = (
        db.query(VehicleDocument)
        .filter(
            VehicleDocument.vehicle_id == vehicle_id,
            VehicleDocument.tenant_id == tenant_id,
        )
        .all()
    )

    uploaded_codes = {d.document_type for d in uploaded_docs}

    # 4️⃣ Missing documents check
    missing = mandatory_codes - uploaded_codes
    if missing:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Mandatory vehicle documents missing",
                "missing_documents": list(missing),
            },
        )
    # 5️⃣ Approve documents
    for doc in uploaded_docs:
        if doc.verification_status != "approved":
            doc.verification_status = "approved"
            doc.verified_by = int(user["sub"])
            doc.verified_at_utc = datetime.now(timezone.utc)



    # 6️⃣ Activate vehicle
    vehicle.status = "active"
    vehicle.updated_at_utc = datetime.now(timezone.utc)
    vehicle.updated_by = int(user["sub"])

    db.commit()

    return {
        "status": "vehicle approved",
        "vehicle_id": vehicle_id,
        "documents_approved": len(uploaded_docs),
    }

