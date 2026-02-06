from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.dependencies import get_db
from app.core.security.roles import get_or_create_fleet_owner

from app.models.core.fleet_owners.fleet_owner_documents import FleetOwnerDocument
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.lookups.tenant_Fleet_document_types import TenantFleetDocumentType

router = APIRouter(tags=["Fleet Owner – Details"],)

@router.get("/")
def get_fleet(
   
    db: Session = Depends(get_db),
    fleetIDget :FleetOwner = Depends(get_or_create_fleet_owner),
):
    fleetOwnerId = fleetIDget.fleet_owner_id
    fleet = db.get(FleetOwner, fleetOwnerId)
    print(fleet)

    if not fleet:
        raise HTTPException(404, "Fleet owner not found")

    return {
        "fleet_owner_id": fleet.fleet_owner_id,
        "fleet_name": fleet.business_name,
        "contact_mail": fleet.contact_email,
        "approval_status": fleet.approval_status,
        "onboarding_status": fleet.onboarding_status,
    }

@router.get("/{fleet_owner_id}/compliance")
def fleet_compliance_status(
    fleet_owner_id: int,
    db: Session = Depends(get_db),
    _: FleetOwner = Depends(get_or_create_fleet_owner),
):
    required = (
        db.query(TenantFleetDocumentType)
        .filter(TenantFleetDocumentType.is_mandatory.is_(True))
        .all()
    )

    uploaded = (
        db.query(FleetOwnerDocument)
        .filter(FleetOwnerDocument.fleet_owner_id == fleet_owner_id)
        .all()
    )

    uploaded_map = {d.document_type: d for d in uploaded}

    missing = []
    pending = []

    for doc in required:
        uploaded_doc = uploaded_map.get(doc.document_code)

        if not uploaded_doc:
            missing.append(doc.document_code)
        elif uploaded_doc.verification_status != "approved":
            pending.append(doc.document_code)

    return {
        "is_compliant": not missing and not pending,
        "missing_documents": missing,
        "pending_documents": pending,
    }
