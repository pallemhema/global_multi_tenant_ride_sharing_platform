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
@router.get("profile/{tenant_id}")
def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    return {
        "tenant_id": tenant.tenant_id,
        "tenant_name": tenant.tenant_name,
        "legal_name": tenant.legal_name,
        "status": tenant.status,
        "approval_status": tenant.approval_status,
    }

@router.get("/{tenant_id}/compliance-status")
def tenant_compliance_status(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    required = (
        db.query(TenantFleetDocumentType)
        .filter(TenantFleetDocumentType.is_mandatory.is_(True))
        .all()
    )

    uploaded = (
        db.query(TenantDocument)
        .filter(TenantDocument.tenant_id == tenant_id)
        .all()
    )

    uploaded_map = {d.document_type: d for d in uploaded}

    missing = []
    pending = []

    for doc in required:
        uploaded_doc = uploaded_map.get(doc.document_code)

        if not uploaded_doc:
            missing.append(doc.document_code)
        elif uploaded_doc.verification_status != "approved":
            pending.append(doc.document_code)

    return {
        "is_compliant": not missing and not pending,
        "missing_documents": missing,
        "pending_documents": pending,
    }





@router.get("/{tenant_id}/fleets")
def list_fleets(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    rows = (
        db.query(
            FleetOwner.fleet_owner_id.label("fleet_owner_id"),
            FleetOwner.business_name.label("business_name"),
            FleetOwner.contact_email.label("contact_email"),

            # 🚗 Count vehicles safely
            func.count(func.distinct(Vehicle.vehicle_id)).label("vehicle_count"),

            # 🌍 Aggregate city names
            func.array_agg(
                func.distinct(City.city_name)
            ).label("cities"),
        )
        .outerjoin(
            Vehicle,
            Vehicle.fleet_owner_id == FleetOwner.fleet_owner_id,
        )
        .outerjoin(
            FleetOwnerCity,
            (FleetOwnerCity.fleet_owner_id == FleetOwner.fleet_owner_id)
            & (FleetOwnerCity.is_active.is_(True)),
        )
        .outerjoin(
            City,
            City.city_id == FleetOwnerCity.city_id,
        )
        .filter(FleetOwner.tenant_id == tenant_id)
        .group_by(
            FleetOwner.fleet_owner_id,
            FleetOwner.business_name,
            FleetOwner.contact_email,
        )
        .all()
    )

    # ✅ Convert rows to JSON-safe dicts
    fleets = [
        {
            "fleet_owner_id": r.fleet_owner_id,
            "business_name": r.business_name,
            "contact_email": r.contact_email,
            "vehicle_count": r.vehicle_count,
            "cities": r.cities or [],
        }
        for r in rows
    ]

    return fleets

