
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.core.pricing.tenant_fare_config import TenantFareConfig
from app.schemas.core.pricing.tenant_fare_config import FareConfigCreate, FareConfigUpdate,SurgeUpdate
from app.core.security.roles import require_tenant_admin

from app.core.dependencies import get_db

router = APIRouter(prefix="/tenant-admin",tags=['Tenant - Fare Config'])

@router.post("/fare-config")
def create_fare_config(
    payload: FareConfigCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    now = datetime.now(timezone.utc)
    existing = db.query(TenantFareConfig).filter(
        TenantFareConfig.tenant_id == admin.tenant_id,
        TenantFareConfig.city_id == payload.city_id,
        TenantFareConfig.vehicle_category == payload.vehicle_category,
        TenantFareConfig.effective_to.is_(None)
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Active fare rule already exists for this vehicle in this city"
        )


    new_rule = TenantFareConfig(
        tenant_id=admin.tenant_id,  # 🔐 secure
        country_id=payload.country_id,
        city_id=payload.city_id,
        vehicle_category=payload.vehicle_category,
        base_fare=payload.base_fare,
        rate_per_km=payload.rate_per_km,
        rate_per_minute=payload.rate_per_minute,
        tax_percentage=payload.tax_percentage,
        effective_from=payload.effective_from,
        created_at=now,
        updated_at=now,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )

    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)

    return {"message": "Fare config created", "id": new_rule.fare_rule_id}

@router.put("/fare-config/{fare_rule_id}")
def update_fare_config(
    fare_rule_id: int,
    payload: FareConfigUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    rule = db.query(TenantFareConfig).filter(
        TenantFareConfig.fare_rule_id == fare_rule_id,
        TenantFareConfig.tenant_id == admin.tenant_id  # 🔐 critical
    ).first()


    if not rule:
        raise HTTPException(status_code=404, detail="Fare rule not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(rule, field, value)

    rule.updated_at = datetime.now(timezone.utc)
    rule.updated_by = admin.user_id

    db.commit()

    return {"message": "Fare config updated"}

@router.delete("/fare-config/{fare_rule_id}")
def delete_fare_config(
    fare_rule_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    rule = db.query(TenantFareConfig).filter(
        TenantFareConfig.fare_rule_id == fare_rule_id,
        TenantFareConfig.tenant_id == admin.tenant_id  # 🔐 critical
    ).first()


    if not rule:
        raise HTTPException(status_code=404, detail="Fare rule not found")

    rule.effective_to = datetime.now(timezone.utc)
    rule.updated_at = datetime.now(timezone.utc)
    rule.updated_by = admin.user_id

    db.commit()

    return {"message": "Fare config expired (soft deleted)"}
