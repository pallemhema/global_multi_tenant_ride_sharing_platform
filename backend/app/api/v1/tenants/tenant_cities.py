from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db
from app.models.core.tenants.tenant_cities import TenantCity
from app.schemas.core.tenants.tenant_city import (
    TenantCityCreate, TenantCityOut
)
from app.models.lookups.city import City
from app.models.core.tenants.tenant_countries import TenantCountry
from fastapi import HTTPException
from app.core.security.roles import require_tenant_admin

router = APIRouter(prefix="/tenants/{tenant_id}/cities", tags=["Tenant Cities"])


@router.post("", response_model=TenantCityOut)
def add_city(
    tenant_id: int,
    payload: TenantCityCreate,
    db: Session = Depends(get_db),
   user: dict = Depends(require_tenant_admin)
):
    city = db.get(City, payload.city_id)
    if not city:
        raise HTTPException(404, "City not found")

    tenant_country = (
        db.query(TenantCountry)
        .filter(
            TenantCountry.tenant_id == tenant_id,
            TenantCountry.country_id == city.country_id,
            TenantCountry.is_active == True
        )
        .first()
    )

    if not tenant_country:
        raise HTTPException(
            400,
            "Tenant not enabled for this country"
        )

    record = TenantCity(
        tenant_id=tenant_id,
        **payload.model_dump()
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=List[TenantCityOut])
def list_cities(
    tenant_id: int,
    db: Session = Depends(get_db)
):
    return (
        db.query(TenantCity)
        .filter(TenantCity.tenant_id == tenant_id)
        .all()
    )

@router.patch("/{city_id}/disable")
def disable_city(
    tenant_id: int,
    city_id: int,
    db: Session = Depends(get_db)
):
    record = (
        db.query(TenantCity)
        .filter(
            TenantCity.tenant_id == tenant_id,
            TenantCity.city_id == city_id
        )
        .first()
    )

    if not record:
        raise HTTPException(404, "City not found")

    record.is_active = False
    db.commit()

    return {"message": "City disabled"}
