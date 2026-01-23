from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.models.lookups.vehicle_document_type import VehicleDocumentType
from app.models.core.vehicles.vehicle_docuemnts import VehicleDocument
from app.models.core.vehicles.vehicles import Vehicle

router = APIRouter(
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

    # 3️⃣ Uploaded vehicle documents
    docs = (
        db.query(VehicleDocument)
        .filter(
            VehicleDocument.vehicle_id == vehicle_id,
            VehicleDocument.tenant_id == tenant_id,
        )
        .all()
    )

    uploaded_codes = {d.document_type for d in docs}

    # 4️⃣ Missing mandatory documents
    missing_docs = mandatory_codes - uploaded_codes
    if missing_docs:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Mandatory vehicle documents missing",
                "missing_documents": list(missing_docs),
            },
        )

    # 5️⃣ Mandatory documents approval check
    approved_docs = {
        d.document_type
        for d in docs
        if d.verification_status == "approved"
    }

    unapproved_docs = mandatory_codes - approved_docs
    if unapproved_docs:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Mandatory vehicle documents not approved",
                "documents": list(unapproved_docs),
            },
        )

    # 6️⃣ Activate vehicle ONLY
    vehicle.status = "active"
    vehicle.updated_at_utc = datetime.now(timezone.utc)
    vehicle.updated_by = int(user["sub"])

    db.commit()

    return {
        "status": "vehicle approved",
        "vehicle_id": vehicle_id,
        "approved_documents": list(approved_docs),
    }


@router.get("/{tenant_id}/vehicles/pending")
def list_pending_vehicles(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    return (
        db.query(Vehicle)
        .filter(
            Vehicle.tenant_id == tenant_id,
            Vehicle.status != "active",
        )
        .all()
    )
@router.get("/{tenant_id}/vehicles/{vehicle_id}/documents")
def list_vehicle_documents(
    tenant_id: int,
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    return (
        db.query(VehicleDocument)
        .filter(
            VehicleDocument.tenant_id == tenant_id,
            VehicleDocument.vehicle_id == vehicle_id,
        )
        .all()
    )
@router.put("/vehicle-documents/{doc_id}/approve")
def approve_vehicle_document(
    doc_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    doc = db.get(VehicleDocument, doc_id)

    if not doc:
        raise HTTPException(404, "Document not found")

    doc.verification_status = "approved"
    doc.verified_by = int(user["sub"])
    doc.verified_at_utc = datetime.now(timezone.utc)

    db.commit()
    return {"status": "approved"}
@router.put("/vehicle-documents/{doc_id}/reject")
def reject_vehicle_document(
    doc_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    doc = db.get(VehicleDocument, doc_id)

    if not doc:
        raise HTTPException(404, "Document not found")

    doc.verification_status = "rejected"
    doc.verified_by = int(user["sub"])
    doc.verified_at_utc = datetime.now(timezone.utc)

    db.commit()
    return {"status": "rejected"}
