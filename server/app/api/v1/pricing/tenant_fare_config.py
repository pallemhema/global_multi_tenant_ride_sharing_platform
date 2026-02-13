from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import or_

from datetime import datetime, timezone

from app.models.core.pricing.tenant_fare_config import TenantFareConfig
from app.schemas.core.pricing.tenant_fare_config import (
    FareConfigCreate,
    FareConfigUpdate,
    FareConfigDelete
    
)
from app.core.security.roles import require_tenant_admin
from app.core.dependencies import get_db
from app.models.lookups.city import City
from app.models.core.tenants.tenants import Tenant

router = APIRouter(
    prefix="/fare-config",
    tags=["Tenant - Fare Config"]
)

@router.post("")
def create_fare_config(
    payload: FareConfigCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    
    try:
      
        now = datetime.now(timezone.utc)

        if payload.effective_from < now:
            raise HTTPException(
                status_code=400,
                detail="effective_from cannot be in the past"
            )

        existing = db.query(TenantFareConfig).filter(
            TenantFareConfig.tenant_id == admin['tenant_id'],
            TenantFareConfig.country_id == payload.country_id,
            TenantFareConfig.city_id == payload.city_id,
            TenantFareConfig.vehicle_category == payload.vehicle_category,
            TenantFareConfig.effective_to.is_(None)
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Active fare rule already exists"
            )

        rule = TenantFareConfig(
            tenant_id=admin['tenant_id'],
            country_id=payload.country_id,
            city_id=payload.city_id,
            vehicle_category=payload.vehicle_category,
            base_fare=payload.base_fare,
            rate_per_km=payload.rate_per_km,
            rate_per_minute=payload.rate_per_minute,
            tax_percentage=payload.tax_percentage,
            effective_from=payload.effective_from,
            created_at_utc=now,
            updated_at_utc=now,
            created_by=admin['sub'],
            updated_by=admin['sub'],
        )

        db.add(rule)
        db.commit()

        return {"message": "Fare config created"}

    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

@router.put("")
def update_fare_config(
    payload: FareConfigUpdate,
    db: Session = Depends(get_db),
    admin: Tenant = Depends(require_tenant_admin),
):
    print(admin)
    now = datetime.now(timezone.utc)

    active_rule = db.query(TenantFareConfig).filter(
        TenantFareConfig.tenant_id == admin['tenant_id'],
        TenantFareConfig.country_id == payload.country_id,
        TenantFareConfig.city_id == payload.city_id,
        TenantFareConfig.vehicle_category == payload.vehicle_category,
        TenantFareConfig.effective_to.is_(None)
    ).first()

    if not active_rule:
        raise HTTPException(404, "Active fare rule not found")

    # expire old
    active_rule.effective_to = now
    active_rule.updated_at_utc = now
    active_rule.updated_by = admin['sub']

    # create new version
    new_rule = TenantFareConfig(
        tenant_id=admin['tenant_id'],
        country_id=payload.country_id,
        city_id=payload.city_id,
        vehicle_category=payload.vehicle_category,
        base_fare=payload.base_fare or active_rule.base_fare,
        rate_per_km=payload.rate_per_km or active_rule.rate_per_km,
        rate_per_minute=payload.rate_per_minute or active_rule.rate_per_minute,
        tax_percentage=payload.tax_percentage or active_rule.tax_percentage,
        effective_from=now,
        created_at_utc=now,
        updated_at_utc=now,
        created_by=admin['sub'],
        updated_by=admin['sub'],
    )

    db.add(new_rule)
    db.commit()

    return {"message": "Fare config updated"}

@router.delete("")
def delete_fare_config(
    payload: FareConfigDelete,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    try:
        
        now = datetime.now(timezone.utc)

        rule = db.query(TenantFareConfig).filter(
            TenantFareConfig.tenant_id == admin['tenant_id'],
            TenantFareConfig.country_id == payload.country_id,
            TenantFareConfig.city_id == payload.city_id,
            TenantFareConfig.vehicle_category == payload.vehicle_category,
            TenantFareConfig.effective_to.is_(None)
        ).first()

        if not rule:
            raise HTTPException(
                status_code=404,
                detail="Active fare rule not found"
            )

        rule.effective_to = now
        rule.updated_at = now
        rule.updated_by = admin['sub']

        db.commit()

        return {"message": "Fare config expired successfully"}

    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

@router.get("")
def get_active_fare_configs(
    country_id: int,
    city_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    try:
      
        now = datetime.now(timezone.utc)

        rules = db.query(TenantFareConfig).filter(
            TenantFareConfig.tenant_id == admin['tenant_id'],
            TenantFareConfig.country_id == country_id,
            TenantFareConfig.city_id == city_id,
            TenantFareConfig.effective_from <= now,
            or_(
                TenantFareConfig.effective_to.is_(None),
                TenantFareConfig.effective_to > now
            )
        ).all()
        print(rules)

        if not rules:
            return {
                "message": "No active fare config found",
                "data": []
            }

        result = []
        for rule in rules:
            result.append({
                "vehicle_category": rule.vehicle_category,
                "base_fare": float(rule.base_fare),
                "rate_per_km": float(rule.rate_per_km),
                "rate_per_minute": float(rule.rate_per_minute),
                "tax_percentage": float(rule.tax_percentage),
                "effective_from": rule.effective_from,
            })

        return {
            "tenant_id": admin.get("tenant_id"),
            "country_id": country_id,
            "city_id": city_id,
            "data": result
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Database error while fetching fare config"
        )


@router.get("/{vehicle_category}")
def get_vehicle_fare_config(
    vehicle_category: str,
    country_id: int,
    city_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    try:
        now = datetime.now(timezone.utc)

        rule = db.query(TenantFareConfig).filter(
            TenantFareConfig.tenant_id == admin['tenant_id'],
            TenantFareConfig.country_id == country_id,
            TenantFareConfig.city_id == city_id,
            TenantFareConfig.vehicle_category == vehicle_category,
            TenantFareConfig.effective_from <= now,
            or_(
                TenantFareConfig.effective_to.is_(None),
                TenantFareConfig.effective_to > now
            )
        ).first()

        if not rule:
            raise HTTPException(
                status_code=404,
                detail="Active fare config not found"
            )

        return {
            "vehicle_category": rule.vehicle_category,
            "base_fare": float(rule.base_fare),
            "rate_per_km": float(rule.rate_per_km),
            "rate_per_minute": float(rule.rate_per_minute),
            "tax_percentage": float(rule.tax_percentage),
            "effective_from": rule.effective_from,
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Database error while fetching fare config"
        )