from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_app_admin
from app.models.core.tenants.tenants import Tenant
from app.models.core.tenants.tenant_documents import TenantDocument
from app.models.core.tenants.tenant_staff import TenantStaff
from app.schemas.core.tenants.tenant_staff import TenantStaffOut,TenantStaffCreate

from app.models.lookups.tenant_Fleet_document_types import TenantFleetDocumentType

router = APIRouter(
    prefix="/platform",
    tags=["Platform / App Admin"],
)

@router.post("/tenants")
def create_tenant(
    payload: dict,
    db: Session = Depends(get_db),
    _: dict = Depends(require_app_admin),
):
    tenant = Tenant(
        tenant_name=payload["tenant_name"],
        legal_name=payload["legal_name"],
        business_email=payload["business_email"],
        approval_status="pending",
        status="inactive",
    )

    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    return {
        "tenant_id": tenant.tenant_id,
        "status": "created",
    }


@router.post("/tenants/{tenant_id}/approve")
def approve_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_app_admin),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    if tenant.approval_status == "approved":
        raise HTTPException(400, "Tenant already approved")


    # 1️⃣ Get mandatory document types
    mandatory_docs = (
        db.query(TenantFleetDocumentType.document_code)
        .filter(TenantFleetDocumentType.is_mandatory.is_(True))
        .all()
    )
    mandatory_codes = {d.document_code for d in mandatory_docs}

    # 2️⃣ Get approved tenant documents
    approved_docs = (
        db.query(TenantDocument.document_type)
        .filter(
            TenantDocument.tenant_id == tenant_id,
            TenantDocument.verification_status == "approved",
        )
        .all()
    )
    approved_codes = {d.document_type for d in approved_docs}

    # 3️⃣ Find missing documents
    missing = mandatory_codes - approved_codes

    if missing:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Mandatory documents not approved",
                "missing_documents": list(missing),
            },
        )

    # 4️⃣ Approve tenant
    tenant.approval_status = "approved"
    tenant.status = "active"
    tenant.approved_at_utc = datetime.now(timezone.utc)
    tenant.updated_at_utc = datetime.now(timezone.utc)
    tenant.updated_by = int(user["sub"])

    db.commit()

    return {
        "status": "tenant approved",
        "tenant_id": tenant_id,
    }

@router.get("/tenants/{tenant_id}/documents")
def list_tenant_documents(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_app_admin),
):
    return (
        db.query(TenantDocument)
        .filter(TenantDocument.tenant_id == tenant_id)
        .all()
    )


@router.post("/tenants/{tenant_id}/documents/{doc_id}/verify")
def verify_tenant_document(
    tenant_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_app_admin),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    if tenant.status == "active":
        raise HTTPException(
            400,
            "Tenant already active. Document verification is locked."
        )

    doc = db.get(TenantDocument, doc_id)
    if not doc or doc.tenant_id != tenant_id:
        raise HTTPException(404, "Document not found")

    if doc.verification_status == "approved":
        raise HTTPException(400, "Document already approved")

    doc.verification_status = "approved"
    doc.verified_by = int(user["sub"])
    doc.verified_at_utc = datetime.now(timezone.utc)

    db.commit()

    return {
        "status": "document approved",
        "document_type": doc.document_type,
    }


@router.post(
    "/tenants/{tenant_id}/admins",
    response_model=TenantStaffOut
)
def assign_tenant_admin(
    tenant_id: int,
    payload: TenantStaffCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_app_admin),
):
    if payload.role_code != "admin":
        raise HTTPException(
            400,
            "Only tenant admin role can be assigned by platform"
        )

    staff = TenantStaff(
        tenant_id=tenant_id,
        user_id=payload.user_id,
        role_code=payload.role_code,
        status="active",
        created_by=int(user["sub"]),
    )

    db.add(staff)
    db.commit()
    db.refresh(staff)

    return staff
