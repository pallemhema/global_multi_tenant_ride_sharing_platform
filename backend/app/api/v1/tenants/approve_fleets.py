from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.core.fleet_owners.fleet_owners import FleetOwner

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.core.fleet_owners.fleet_owner_documents import FleetOwnerDocument
from app.models.lookups.fleet_document_type import FleetDocumentType


router = APIRouter(
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

    # 1️⃣ Mandatory document codes
    mandatory_docs = (
        db.query(FleetDocumentType.document_code)
        .filter(FleetDocumentType.is_mandatory.is_(True))
        .all()
    )
    mandatory_codes = {d.document_code for d in mandatory_docs}

    # 2️⃣ Fetch uploaded docs
    docs = (
        db.query(FleetOwnerDocument)
        .filter(
            FleetOwnerDocument.tenant_id == tenant_id,
            FleetOwnerDocument.fleet_owner_id == fleet_owner_id,
        )
        .all()
    )

    uploaded_codes = {d.document_type for d in docs}

    # 3️⃣ Missing documents check
    missing = mandatory_codes - uploaded_codes
    if missing:
        raise HTTPException(
            400,
            {
                "message": "Mandatory documents missing",
                "missing_documents": list(missing),
            },
        )

    # 4️⃣ Approval status check (IMPORTANT)
    approved_docs = {
        d.document_type
        for d in docs
        if d.verification_status == "approved"
    }

    unapproved = mandatory_codes - approved_docs
    if unapproved:
        raise HTTPException(
            400,
            {
                "message": "Mandatory documents not approved",
                "documents": list(unapproved),
            },
        )

    # 5️⃣ Approve fleet owner ONLY
    fleet.approval_status = "approved"
    fleet.is_active = True
    fleet.approved_at_utc = datetime.now(timezone.utc)

    db.commit()

    return {
        "status": "fleet owner approved",
        "fleet_owner_id": fleet_owner_id,
        "approved_documents": list(approved_docs),
    }



@router.get("/{tenant_id}/fleet-owners/pending")
def list_pending_fleet_owners(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    return (
        db.query(FleetOwner)
        .filter(
            FleetOwner.tenant_id == tenant_id,
            FleetOwner.approval_status != "approved",
        )
        .all()
    )

@router.get("/{tenant_id}/fleet-owners/{fleet_owner_id}/documents")
def list_fleet_owner_documents(
    tenant_id: int,
    fleet_owner_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    return (
        db.query(FleetOwnerDocument)
        .filter(
            FleetOwnerDocument.tenant_id == tenant_id,
            FleetOwnerDocument.fleet_owner_id == fleet_owner_id,
        )
        .all()
    )


@router.put("/fleet-owner-documents/{doc_id}/approve")
def approve_fleet_owner_document(
    doc_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    doc = db.get(FleetOwnerDocument, doc_id)

    if not doc:
        raise HTTPException(404, "Document not found")

    doc.verification_status = "approved"
    doc.verified_by = int(user["sub"])
    doc.verified_at_utc = datetime.now(timezone.utc)

    db.commit()
    return {"status": "approved"}

@router.put("/fleet-owner-documents/{doc_id}/reject")
def reject_fleet_owner_document(
    doc_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    doc = db.get(FleetOwnerDocument, doc_id)

    if not doc:
        raise HTTPException(404, "Document not found")

    doc.verification_status = "rejected"
    doc.verified_by = int(user["sub"])
    doc.verified_at_utc = datetime.now(timezone.utc)

    db.commit()
    return {"status": "rejected"}
