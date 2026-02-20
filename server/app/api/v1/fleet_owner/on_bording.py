from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.dependencies import get_db
from app.core.security.roles import get_or_create_fleet_owner, require_fleet_owner
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.core.tenants.tenants import Tenant
from app.models.core.tenants.tenant_countries import TenantCountry
from app.models.core.tenants.tenant_cities import TenantCity
from app.models.lookups.city import City

from app.schemas.core.drivers.onboarding import (
    SelectTenantSchema,
    SelectLocationSchema,
)

from app.core.onboarding.engine import (
    block_if_completed,
    enforce_transition,
    build_location_tree,
)

from app.core.onboarding.fleet_flow import (
    FleetOnboardingStatus,
    FLEET_ONBOARDING_FLOW,
)


router = APIRouter(

    tags=["Fleet Owner – Onboarding"],
)


class FleetDetailsPayload(BaseModel):
    business_name: str
    contact_email: str | None = None


# =========================================================
# SELECT TENANT
# =========================================================

@router.post("/select-tenant", status_code=status.HTTP_200_OK)
def select_tenant(
    payload: SelectTenantSchema,
    db: Session = Depends(get_db),
    fleet_owner: FleetOwner = Depends(get_or_create_fleet_owner),
):
    block_if_completed(fleet_owner.onboarding_status, FLEET_ONBOARDING_FLOW)

    tenant = (
        db.query(Tenant)
        .filter(
            Tenant.tenant_id == payload.tenant_id,
            Tenant.approval_status == "approved",
            Tenant.status == "active",
        )
        .first()
    )

    if not tenant:
        raise HTTPException(404, "Tenant not found or inactive")

    enforce_transition(
        fleet_owner.onboarding_status,
        FleetOnboardingStatus.TENANT_SELECTED,
        FLEET_ONBOARDING_FLOW
    )

    fleet_owner.tenant_id = tenant.tenant_id
    fleet_owner.onboarding_status = FleetOnboardingStatus.TENANT_SELECTED

    db.commit()
    db.refresh(fleet_owner)

    return {
        "ok": True,
        "fleet_owner_id": fleet_owner.fleet_owner_id,
        "tenant_id": fleet_owner.tenant_id,
        "onboarding_status": fleet_owner.onboarding_status,
        "countries": build_location_tree(db, tenant.tenant_id),
    }

@router.get("/tenant-locations")
def get_tenant_locations(
    db: Session = Depends(get_db),
    fleet_owner: FleetOwner = Depends(get_or_create_fleet_owner),
):
    """
    Returns tenant countries + cities.
    Used for onboarding resume.
    Does NOT modify onboarding state.
    """

    if not fleet_owner.tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Driver has not selected a tenant yet."
        )

    location_tree = build_location_tree(db, fleet_owner.tenant_id)

    return {
        "tenant_id": fleet_owner.tenant_id,
        "countries": location_tree
    }

# =========================================================
# SELECT LOCATION
# =========================================================

@router.post("/select-location")
def select_location(
    payload: SelectLocationSchema,
    db: Session = Depends(get_db),
    fleet_owner: FleetOwner = Depends(get_or_create_fleet_owner),
):
    block_if_completed(fleet_owner.onboarding_status, FLEET_ONBOARDING_FLOW)

    if not fleet_owner.tenant_id:
        raise HTTPException(400, "Tenant must be selected first.")

    enforce_transition(
        fleet_owner.onboarding_status,
        FleetOnboardingStatus.LOCATION_SELECTED,
        FLEET_ONBOARDING_FLOW
    )

    fleet_owner.country_id = payload.country_id
    fleet_owner.city_id = payload.city_id
    fleet_owner.onboarding_status = FleetOnboardingStatus.LOCATION_SELECTED

    db.commit()
    db.refresh(fleet_owner)

    return {
        "ok": True,
        "fleet_owner_id": fleet_owner.fleet_owner_id,
        "onboarding_status": fleet_owner.onboarding_status,
    }


# =========================================================
# FILL FLEET DETAILS
# =========================================================

@router.post("/upload-fleet-details")
def fill_fleet_details(
    payload: FleetDetailsPayload,
    db: Session = Depends(get_db),
    fleet_owner: FleetOwner = Depends(get_or_create_fleet_owner),
):
    block_if_completed(fleet_owner.onboarding_status, FLEET_ONBOARDING_FLOW)

    enforce_transition(
        fleet_owner.onboarding_status,
        FleetOnboardingStatus.DETAILS_FILLED,
        FLEET_ONBOARDING_FLOW
    )

    fleet_owner.business_name = payload.business_name
    fleet_owner.contact_email = payload.contact_email
    fleet_owner.onboarding_status = FleetOnboardingStatus.DETAILS_FILLED

    db.commit()
    db.refresh(fleet_owner)

    return {
        "ok": True,
        "fleet_owner_id": fleet_owner.fleet_owner_id,
        "onboarding_status": fleet_owner.onboarding_status,
    }


# =========================================================
# SUBMIT DOCUMENTS (COMPLETE)
# =========================================================

@router.post("/submit-documents")
def submit_documents(
    db: Session = Depends(get_db),
    fleet_owner: FleetOwner = Depends(get_or_create_fleet_owner),
):
    block_if_completed(fleet_owner.onboarding_status, FLEET_ONBOARDING_FLOW)

    enforce_transition(
        fleet_owner.onboarding_status,
        FleetOnboardingStatus.COMPLETED,
        FLEET_ONBOARDING_FLOW
    )

    fleet_owner.onboarding_status = FleetOnboardingStatus.COMPLETED

    db.commit()
    db.refresh(fleet_owner)

    return {
        "ok": True,
        "fleet_owner_id": fleet_owner.fleet_owner_id,
        "onboarding_status": fleet_owner.onboarding_status,
        "message": "Fleet onboarding completed successfully.",
    }
