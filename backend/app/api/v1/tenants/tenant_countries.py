from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db
from app.models.core.tenants.tenant_countries import TenantCountry
from app.schemas.core.tenants.tenant_country import (
    TenantCountryCreate, TenantCountryOut
)
from app.core.security.roles import require_tenant_admin

router = APIRouter(prefix="/tenants/{tenant_id}/countries", tags=["Tenant Countries"])


@router.post("", response_model=TenantCountryOut)
def add_country(
    tenant_id: int,
    payload: TenantCountryCreate,
    db: Session = Depends(get_db),
    tenant = Depends(require_tenant_admin)
):
    record = TenantCountry(
        tenant_id=tenant_id,
        **payload.model_dump()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=List[TenantCountryOut])
def list_tenant_cities(
    tenant_id: int,
    db: Session = Depends(get_db),
    tenant=Depends(require_tenant_admin),
):
    return (
        db.query(TenantCountry)
        .filter(
            TenantCountry.tenant_id == tenant_id,
            TenantCountry.is_active.is_(True),
        )
        .all()
    )
