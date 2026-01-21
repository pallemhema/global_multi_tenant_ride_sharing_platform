from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner_active,require_fleet_owner_any_status
from app.models.core.fleet_owners.fleet_owner_documents import FleetOwnerDocument
from app.models.core.vehicles.vehicle_docuemnts import VehicleDocument


from app.schemas.core.fleet_owners.fleet_owner_documents import FleetOwnerDocumentCreate, FleetOwnerDocumentOut
router = APIRouter(
    prefix="/fleet-owner",
    tags=["Fleet Owner"],
)

# 🔹 Upload document
@router.post(
    "/tenants/{tenant_id}/documents",
    response_model=FleetOwnerDocumentOut,
)
def upload_fleet_owner_document(
    tenant_id: int,
    payload: FleetOwnerDocumentCreate,
    db: Session = Depends(get_db),
    fleet = Depends(require_fleet_owner_any_status),
):
    print(fleet.fleet_owner_id)
    doc = FleetOwnerDocument(
        tenant_id=tenant_id,
        fleet_owner_id=fleet.fleet_owner_id,
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


# 🔹 Edit document (only if not approved)
@router.put(
    "/tenants/{tenant_id}/documents/{doc_id}",
    response_model=FleetOwnerDocumentOut,
)
def update_fleet_owner_document(
    tenant_id: int,
    doc_id: int,
    payload: FleetOwnerDocumentCreate,
    db: Session = Depends(get_db),
    fleet = Depends(require_fleet_owner_any_status),
):
    doc = db.get(FleetOwnerDocument, doc_id)

    if not doc or doc.fleet_owner_id != fleet.fleet_owner_id:
        raise HTTPException(404, "Document not found")

    if doc.verification_status == "approved":
        raise HTTPException(400, "Approved document cannot be edited")

    doc.document_number = payload.document_number
    doc.document_url = payload.document_url
    doc.expiry_date = payload.expiry_date
    doc.updated_at_utc = datetime.now(timezone.utc)
    doc.updated_by = fleet.user_id

    db.commit()
    return doc


# 🔹 List documents
@router.get(
    "/tenants/{tenant_id}/documents",
    response_model=list[FleetOwnerDocumentOut],
)
def list_fleet_owner_documents(
    tenant_id: int,
    db: Session = Depends(get_db),
    fleet = Depends(require_fleet_owner_any_status),
):
    return (
        db.query(FleetOwnerDocument)
        .filter(
            FleetOwnerDocument.tenant_id == tenant_id,
            FleetOwnerDocument.fleet_owner_id == fleet.fleet_owner_id,
        )
        .all()
    )



@router.post("/vehicles/{vehicle_id}/documents")
def upload_vehicle_document(
    vehicle_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    fleet = Depends(require_fleet_owner_active),
):
    doc = VehicleDocument(
        vehicle_id=vehicle_id,
        tenant_id=fleet.tenant_id,
        document_type=payload["document_type"],
        document_number=payload.get("document_number"),
        document_url=payload["document_url"],
        verification_status="pending",
        created_by=fleet.user_id,
    )

    db.add(doc)
    db.commit()
    return {"status": "uploaded"}