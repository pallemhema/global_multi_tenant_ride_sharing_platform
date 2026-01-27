from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.jwt import verify_access_token

from app.models.core.tenants.tenants import Tenant
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.core.drivers.drivers import Driver
from app.models.core.tenants.tenant_staff import TenantStaff

router = APIRouter(
    tags=["Fleet Owner – Onboarding"],
)


@router.post("/select-tenant", status_code=status.HTTP_201_CREATED)
def select_tenant_for_fleet_owner(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    token: dict = Depends(verify_access_token),
):
    """
    FIRST-TIME ONLY:
    Locks a tenant for fleet owner permanently.
    """

    user_id = int(token["sub"])
    tenant_id = payload.get("tenant_id")

    # 1️⃣ Validate tenant
    tenant = (
        db.query(Tenant)
        .filter(
            Tenant.tenant_id == tenant_id,
            Tenant.approval_status == "approved",
            Tenant.status == "active",
        )
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=400,
            detail="Tenant is not active or not approved",
        )

    # 2️⃣ Ensure user has NO tenant role already
    if db.query(FleetOwner).filter(FleetOwner.user_id == user_id).first():
        raise HTTPException(400, "Fleet owner already onboarded")

    if db.query(Driver).filter(Driver.user_id == user_id).first():
        raise HTTPException(400, "User already registered as driver")

    if db.query(TenantStaff).filter(TenantStaff.user_id == user_id).first():
        raise HTTPException(400, "Tenant staff cannot become fleet owner")

    # 3️⃣ Create fleet owner (PENDING approval)
    fleet_owner = FleetOwner(
        tenant_id=tenant_id,
        user_id=user_id,
        business_name=payload["business_name"],
        contact_email=payload.get("contact_email"),
        approval_status="pending",
        is_active=False,
        created_at_utc=datetime.now(timezone.utc),
        created_by=user_id,
    )

    db.add(fleet_owner)
    db.commit()
    db.refresh(fleet_owner)

    return {
        "status": "onboarding_started",
        "fleet_owner_id": fleet_owner.fleet_owner_id,
        "tenant_id": tenant_id,
        "approval_status": fleet_owner.approval_status,
        "next_step": "upload_documents",
    }

