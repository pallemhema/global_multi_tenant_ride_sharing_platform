# app/api/v1/driver/onboarding.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.jwt import verify_access_token
from app.models.core.drivers.drivers import Driver
from app.models.core.tenants.tenants import Tenant

router = APIRouter(
    prefix="/driver",
    tags=["Driver – Onboarding"],
)


@router.post("/select-tenant", status_code=status.HTTP_201_CREATED)
def select_tenant_for_driver(
    payload: dict,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_access_token),
):
    user_id = int(token["sub"])
    tenant_id = payload.get("tenant_id")
    home_city_id = payload.get("home_city_id")

    # 1️⃣ Validate tenant
    tenant = (
        db.query(Tenant)
        .filter(
            Tenant.tenant_id == tenant_id,
            Tenant.status == "active",
            Tenant.approval_status == "approved",
        )
        .first()
    )
    if not tenant:
        raise HTTPException(400, "Tenant not active")

    # 2️⃣ Prevent re-onboarding
    if db.query(Driver).filter(Driver.user_id == user_id).first():
        raise HTTPException(400, "Driver already onboarded")

    # 3️⃣ Create driver (PENDING)
    driver = Driver(
        tenant_id=tenant_id,
        user_id=user_id,
        home_city_id=home_city_id,
        driver_type="individual",
        kyc_status="pending",
        is_active=False,
        created_at_utc=datetime.now(timezone.utc),
        created_by=user_id,
    )

    db.add(driver)
    db.commit()
    db.refresh(driver)

    return {
        "status": "onboarding_started",
        "driver_id": driver.driver_id,
        "tenant_id": tenant_id,
        "next_step": "upload_documents",
    }
