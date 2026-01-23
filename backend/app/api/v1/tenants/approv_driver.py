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
    tags=["Tenant Admin – Driver Approval"],
)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.models.core.drivers.drivers import Driver
from app.models.core.drivers.driver_documents import DriverDocument
from app.models.lookups.driver_document_type import DriverDocumentType

router = APIRouter(
    tags=["Tenant Admin – Driver Approval"],
)


@router.post("/{tenant_id}/drivers/{driver_id}/approve")
def approve_driver(
    tenant_id: int,
    driver_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    # 🔍 Fetch driver
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

    # 1️⃣ Mandatory document codes
    mandatory_docs = (
        db.query(DriverDocumentType.document_code)
        .filter(DriverDocumentType.is_mandatory.is_(True))
        .all()
    )

    mandatory_codes = {d.document_code for d in mandatory_docs}

    # 2️⃣ Fetch uploaded documents
    docs = (
        db.query(DriverDocument)
        .filter(
            DriverDocument.driver_id == driver_id,
            DriverDocument.tenant_id == tenant_id,
        )
        .all()
    )

    uploaded_codes = {d.document_type for d in docs}

    # ❌ Missing mandatory documents
    missing_docs = mandatory_codes - uploaded_codes
    if missing_docs:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Mandatory driver documents missing",
                "missing_documents": list(missing_docs),
            },
        )

    # 3️⃣ Check approval status of mandatory docs
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
                "message": "Mandatory documents not approved",
                "documents": list(unapproved_docs),
            },
        )

    # 4️⃣ Approve driver (DO NOT touch documents)
    driver.kyc_status = "approved"
    driver.is_active = True
    driver.approved_at_utc = datetime.now(timezone.utc)

    db.commit()

    return {
        "status": "driver approved",
        "driver_id": driver_id,
        "approved_documents": list(approved_docs),
    }


@router.get("/{tenant_id}/drivers/pending")
def list_pending_drivers(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    return (
        db.query(Driver)
        .filter(
            Driver.tenant_id == tenant_id,
            Driver.kyc_status != "approved",
        )
        .all()
    )

@router.get("/{tenant_id}/drivers/{driver_id}/documents")
def list_driver_documents(
    tenant_id: int,
    driver_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    return (
        db.query(DriverDocument)
        .filter(
            DriverDocument.tenant_id == tenant_id,
            DriverDocument.driver_id == driver_id,
        )
        .all()
    )
@router.put("/documents/{doc_id}/approve")
def approve_driver_document(
    doc_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    doc = db.get(DriverDocument, doc_id)

    if not doc:
        raise HTTPException(404, "Document not found")

    doc.verification_status = "approved"
    doc.verified_by = int(user["sub"])
    doc.verified_at_utc = datetime.now(timezone.utc)

    db.commit()
    return {"status": "approved"}
@router.put("/documents/{doc_id}/reject")
def reject_driver_document(
    doc_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    doc = db.get(DriverDocument, doc_id)

    if not doc:
        raise HTTPException(404, "Document not found")

    doc.verification_status = "rejected"
    doc.verified_by = int(user["sub"])
    doc.verified_at_utc = datetime.now(timezone.utc)

    db.commit()
    return {"status": "rejected"}
