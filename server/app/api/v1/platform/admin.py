from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_app_admin
from app.core.security.password import hash_password

from app.models.core.tenants.tenants import Tenant
from app.models.core.tenants.tenant_documents import TenantDocument
from app.models.core.tenants.tenant_staff import TenantStaff
from app.models.core.tenants.tenant_countries import TenantCountry
from app.models.core.tenants.tenant_cities import TenantCity
from app.models.core.users.users import User
from app.schemas.core.admins.create_tenant_admin import TenantAdminCreate

from app.models.lookups.country import Country
from app.models.lookups.tenant_Fleet_document_types import TenantFleetDocumentType
from sqlalchemy import func

router = APIRouter(
    prefix="/app-admin",
    tags=["Platform / App Admin"],
)

@router.post("/create-tenant")
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


@router.post("/tenants/{tenant_id}/admins")
def create_tenant_admin_by_tenant_id(
    tenant_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(require_app_admin),
):
    # 1️⃣ Validate tenant
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    # 2️⃣ Ensure email uniqueness
    existing = (
        db.query(User)
        .filter(User.email == payload.get("email"))
        .first()
    )
    if existing:
        raise HTTPException(400, "User with this email already exists")

    # 3️⃣ Create tenant admin user
    new_user = User(
        email=payload.get("email"),
        password_hash=hash_password(payload.get("password")),
        email_verified=True,
        is_active=True,
        is_app_admin=False,
    )

    db.add(new_user)
    db.flush()  # get user_id

    # 4️⃣ Assign tenant-admin role
    staff = TenantStaff(
        tenant_id=tenant_id,
        user_id=new_user.user_id,
        role_code="admin",
        status="active",
        created_by=int(user["sub"]),
    )

    db.add(staff)
    db.commit()

    return {
        "message": "Tenant admin created",
        "tenant_id": tenant_id,
        "user_id": new_user.user_id,
        "email": new_user.email,
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


@router.post("/tenants/{tenant_id}/reject")

def reject_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_app_admin),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    if tenant.approval_status == "approved":
        raise HTTPException(400, "Tenant already approved")


    
    # 4️⃣ Approve tenant
    tenant.approval_status = "rejected"
    tenant.updated_at_utc = datetime.now(timezone.utc)
    tenant.updated_by = int(user["sub"])

    db.commit()

    return {
        "status": "tenant rejected",
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


@router.post("/tenants/{tenant_id}/documents/{doc_id}/approve")
def approve_tenant_document(
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

@router.post("/tenants/{tenant_id}/documents/{doc_id}/reject")
def reject_tenant_document(
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

    doc.verification_status = "rejected"
    doc.verified_by = int(user["sub"])
    doc.verified_at_utc = datetime.now(timezone.utc)

    db.commit()

    return {
        "status": "document rejected",
        "document_type": doc.document_type,
    }




@router.get("/tenants/summary")
def tenant_summary(
    db: Session = Depends(get_db),
    _: dict = Depends(require_app_admin),
):
    total = db.query(func.count(Tenant.tenant_id)).scalar()

    approved = db.query(func.count(Tenant.tenant_id)).filter(
        Tenant.approval_status == "approved"
    ).scalar()

    pending = db.query(func.count(Tenant.tenant_id)).filter(
        Tenant.approval_status == "pending"
    ).scalar()

    rejected = db.query(func.count(Tenant.tenant_id)).filter(
        Tenant.approval_status == "rejected"
    ).scalar()

    active = db.query(func.count(Tenant.tenant_id)).filter(
        Tenant.status == "active"
    ).scalar()

    inactive = db.query(func.count(Tenant.tenant_id)).filter(
        Tenant.status == "inactive"
    ).scalar()

    return {
        "total_tenants": total,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
        "active": active,
        "inactive": inactive,
    }


@router.post("/tenants")
def create_tenant_endpoint(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _: dict = Depends(require_app_admin),
):
    tenant = Tenant(
        tenant_name=payload.get("tenant_name"),
        legal_name=payload.get("legal_name") or payload.get("tenant_name"),
        business_email=payload.get("business_email"),
        city=payload.get("city", ""),
        country=payload.get("country", ""),
        business_registration_number=payload.get("business_registration_number", ""),
        approval_status="pending",
        status="inactive",
    )

    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    return {
        "id": tenant.tenant_id,
        "tenant_id": tenant.tenant_id,
        "name": tenant.tenant_name,
        "business_email": tenant.business_email,
        "status": "created",
    }


@router.get("/tenants")
def list_tenants(
    db: Session = Depends(get_db),
    _: dict = Depends(require_app_admin),
):
    tenants = db.query(Tenant).all()

    

    return [
        {
            "id": t.tenant_id,
            "name": t.tenant_name,
            "legal_name": t.legal_name,
            "business_email": t.business_email,
            "business_registration_number": t.business_registration_number,
            "approval_status": t.approval_status,
            "status": t.status,
            "created_at_utc": t.created_at_utc,
            "approved_at_utc": t.approved_at_utc,
        }
        for t in tenants
    ]


@router.get("/tenants/{tenant_id}")
def get_tenant_details(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_app_admin),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    tenant_countries = (
        db.query(TenantCountry)
        .filter(
            TenantCountry.tenant_id == tenant_id,
            TenantCountry.is_active == True
        )
        .all()
    )

    country_ids = [tc.country_id for tc in tenant_countries]

    countries = (
        db.query(Country)
        .filter(Country.country_id.in_(country_ids))
        .all()
    )

    return {
        "id": tenant.tenant_id,
        "name": tenant.tenant_name,
        "legal_name": tenant.legal_name,
        "business_email": tenant.business_email,
        "business_registration_number": tenant.business_registration_number,
        "approval_status": tenant.approval_status,
        "status": tenant.status,
        "created_at_utc": tenant.created_at_utc,
        "approved_at_utc": tenant.approved_at_utc,
        "countries": [
            {
                "country_id": c.country_id,
                "country_name": c.country_name,
                "currency_code": c.default_currency,
            }
            for c in countries
        ],
    }

@router.get("/tenants/{tenant_id}/admin")
def get_tenant_admin(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_app_admin),
):
    # Check if tenant exists
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    # Find tenant admin staff
    admin_staff = (
        db.query(TenantStaff, User)
        .join(User, TenantStaff.user_id == User.user_id)
        .filter(
            TenantStaff.tenant_id == tenant_id,
            TenantStaff.role_code == "admin",
        )
        .first()
    )

    if not admin_staff:
        return {
            "has_admin": False,
            "admin": None,
        }

    staff, user = admin_staff
    return {
        "has_admin": True,
        "admin": {
            "user_id": user.user_id,
            "email": user.email,
            "is_active": user.is_active,
        },
    }