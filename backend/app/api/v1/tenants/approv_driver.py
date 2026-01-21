# app/api/v1/tenant_admin/drivers.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.models.core.drivers.drivers import Driver
from app.models.core.drivers.driver_documents import DriverDocument
from app.models.lookups.driver_document_type import DriverDocumentType

router = APIRouter(
    prefix="/tenants",
    tags=["Tenant Admin – Driver Approval"],
)


@router.post("/{tenant_id}/drivers/{driver_id}/approve")
def approve_driver(
    tenant_id: int,
    driver_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    driver = (
        db.query(Driver)
        .filter(
            Driver.driver_id == driver_id,
            Driver.tenant_id == tenant_id,
        )
        .first()
    )
    if not driver:
        raise HTTPException(404, "Driver not found")

    # 1️⃣ Mandatory docs
    mandatory_docs = (
        db.query(DriverDocumentType.document_code)
        .filter(DriverDocumentType.is_mandatory.is_(True))
        .all()
    )
    mandatory_codes = {d.document_code for d in mandatory_docs}

    docs = (
        db.query(DriverDocument)
        .filter(
            DriverDocument.driver_id == driver_id,
            DriverDocument.tenant_id == tenant_id,
        )
        .all()
    )
    uploaded_codes = {d.document_type for d in docs}

    missing = mandatory_codes - uploaded_codes
    if missing:
        raise HTTPException(
            400,
            {
                "message": "Mandatory driver documents missing",
                "missing_documents": list(missing),
            },
        )

    # 2️⃣ Approve all docs
    for doc in docs:
        doc.verification_status = "approved"
        doc.verified_by = int(user["sub"])
        doc.verified_at_utc = datetime.now(timezone.utc)

    # 3️⃣ Activate driver
    driver.kyc_status = "approved"
    driver.is_active = True
    driver.approved_at_utc = datetime.now(timezone.utc)

    db.commit()

    return {
        "status": "driver approved",
        "driver_id": driver_id,
        "documents_approved": len(docs),
    }
