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

router = APIRouter()
@router.get("/{tenant_id}")
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


from sqlalchemy import func





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


from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin

from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.core.fleet_owners.fleet_owner_cities import FleetOwnerCity

from app.models.core.drivers.drivers import Driver
from app.models.core.trips.trips import Trip
# from app.models.core.tenants. import TenantWallet
@router.get("/{tenant_id}/dashboard")
def tenant_dashboard(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    # 🌍 Operating countries
    operating_countries = (
        db.query(func.count(func.distinct(City.country_id)))
        .join(FleetOwnerCity, FleetOwnerCity.city_id == City.city_id)
        .join(FleetOwner, FleetOwner.fleet_owner_id == FleetOwnerCity.fleet_owner_id)
        .filter(
            FleetOwner.tenant_id == tenant_id,
            FleetOwnerCity.is_active.is_(True),
        )
        .scalar()
        or 0
    )

    # 🏙️ Operating cities
    operating_cities = (
        db.query(func.count(func.distinct(City.city_id)))
        .join(FleetOwnerCity, FleetOwnerCity.city_id == City.city_id)
        .join(FleetOwner, FleetOwner.fleet_owner_id == FleetOwnerCity.fleet_owner_id)
        .filter(
            FleetOwner.tenant_id == tenant_id,
            FleetOwnerCity.is_active.is_(True),
        )
        .scalar()
        or 0
    )

    # 🚚 Total fleets
    total_fleets = (
        db.query(func.count(FleetOwner.fleet_owner_id))
        .filter(
            FleetOwner.tenant_id == tenant_id,
            FleetOwner.approval_status == "approved",
        )
        .scalar()
        or 0
    )

    # 👨‍✈️ Total drivers
    total_drivers = (
        db.query(func.count(Driver.driver_id))
        .filter(
            Driver.tenant_id == tenant_id,
            Driver.kyc_status == "approved",
        )
        .scalar()
        or 0
    )

    # 🚖 Fleet drivers
    fleet_drivers = (
        db.query(func.count(Driver.driver_id))
        .filter(
            Driver.tenant_id == tenant_id,
            Driver.driver_type == "fleet_driver",
            Driver.kyc_status == "approved",
        )
        .scalar()
        or 0
    )

    # 🧍 Independent drivers
    independent_drivers = (
        db.query(func.count(Driver.driver_id))
        .filter(
            Driver.tenant_id == tenant_id,
            Driver.driver_type == "individual",
            Driver.kyc_status == "approved",
        )
        .scalar()
        or 0
    )

    # 💰 Total earnings
    total_earnings = (
        db.query(func.coalesce(func.sum(Trip.fare_amount), 0))
        .filter(
            Trip.tenant_id == tenant_id,
            Trip.trip_status == "completed",
        )
        .scalar()
        or 0
    )

    return {
        "operating_countries": operating_countries,
        "operating_cities": operating_cities,
        "total_fleets": total_fleets,
        "drivers": {
            "total": total_drivers,
            "fleet": fleet_drivers,
            "independent": independent_drivers,
        },
        "total_earnings": float(total_earnings),
        "wallet_balance": 0.0,
    }
