
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner
from app.schemas.core.fleet_owners.fleet_owner_cities import FleetOwnerCityCreate
from app.models.core.tenants.tenant_cities import TenantCity
from app.models.core.fleet_owners.fleet_owner_cities import FleetOwnerCity

router = APIRouter(
    tags=["Fleet Owner - cities"],
)

@router.get("/tenant-cities")
def list_available_tenant_cities(
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    return (
        db.query(TenantCity)
        .filter(
            TenantCity.tenant_id == fleet_owner.tenant_id,
            TenantCity.is_active.is_(True),
        )
        .all()
    )

@router.post("/cities")
def add_fleet_owner_city(
    payload: FleetOwnerCityCreate,
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    # City must exist for tenant
    tenant_city = (
        db.query(TenantCity)
        .filter(
            TenantCity.tenant_id == fleet_owner.tenant_id,
            TenantCity.city_id == payload.city_id,
            TenantCity.is_active.is_(True),
        )
        .first()
    )
    if not tenant_city:
        raise HTTPException(
            400,
            "City not enabled for tenant",
        )
    
    

    # Prevent duplicates
    existing = (
        db.query(FleetOwnerCity)
        .filter(
            FleetOwnerCity.fleet_owner_id == fleet_owner.fleet_owner_id,
            FleetOwnerCity.city_id == payload.city_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "City already added for fleet owner")

    fleet_city = FleetOwnerCity(
        tenant_id=fleet_owner.tenant_id,
        fleet_owner_id=fleet_owner.fleet_owner_id,
        city_id=payload.city_id,
        created_by=fleet_owner.user_id,
    )

    db.add(fleet_city)
    db.commit()

    return {"status": "fleet owner city added"}


@router.get("/cities")
def list_fleet_owner_cities(
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    return (
        db.query(FleetOwnerCity)
        .filter(
            FleetOwnerCity.fleet_owner_id == fleet_owner.fleet_owner_id,
            FleetOwnerCity.is_active.is_(True),
        )
        .all()
    )
