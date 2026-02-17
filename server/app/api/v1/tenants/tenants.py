from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin


from app.schemas.core.tenants.tenant_region import TenantRegionCreate
from app.models.core.tenants.tenants import Tenant
from app.models.lookups.tenant_Fleet_document_types import TenantFleetDocumentType
from app.models.core.tenants.tenant_documents import TenantDocument

from sqlalchemy import func
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.core.fleet_owners.fleet_owner_cities import FleetOwnerCity

from app.models.lookups.city import City

from fastapi import APIRouter
from sqlalchemy import func

router = APIRouter(tags=["Tenants - Admin"])


@router.get("/profile/{tenant_id}")
def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    
    print

    return {
        "tenant_id": tenant.tenant_id,
        "tenant_name": tenant.tenant_name,
        "legal_name": tenant.legal_name,
        "status": tenant.status,
        "approval_status": tenant.approval_status,
    }

