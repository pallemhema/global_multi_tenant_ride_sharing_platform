from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import get_or_create_driver, require_driver
from app.models.core.drivers.drivers import Driver
from app.models.core.tenants.tenants import Tenant
from app.models.core.tenants.tenant_countries import TenantCountry
from app.models.core.tenants.tenant_cities import TenantCity
from app.models.lookups.city import City
from app.models.lookups.country import Country

from app.schemas.core.drivers.onboarding import (
    SelectTenantSchema,
    DriverTypeSchema,
    SelectLocationSchema,
    SubmitDocumentsResponse,
)

from app.core.onboarding.engine import  block_if_completed, enforce_transition, build_location_tree
from app.core.onboarding.driver_flow import DriverOnboardingStatus, DRIVER_ONBOARDING_FLOW
router = APIRouter(
    prefix="/driver",
    tags=["Driver – Onboarding"],
)



# =========================================================
# SELECT TENANT
# =========================================================

@router.post("/select-tenant")
def select_tenant(
    payload: SelectTenantSchema,
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_or_create_driver),
):

    block_if_completed(driver.onboarding_status,DRIVER_ONBOARDING_FLOW)


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
        raise HTTPException(
            status_code=404,
            detail="Tenant not found or inactive"
        )

    driver.tenant_id = tenant.tenant_id
    enforce_transition(
        driver.onboarding_status,
        DriverOnboardingStatus.TENANT_SELECTED,
        DRIVER_ONBOARDING_FLOW
    )
    driver.onboarding_status = DriverOnboardingStatus.TENANT_SELECTED


    db.commit()
    db.refresh(driver)

    location_tree = build_location_tree(db, tenant.tenant_id)

    return {
        "ok": True,
        "driver_id": driver.driver_id,
        "tenant_id": driver.tenant_id,
        "onboarding_status": driver.onboarding_status,
        "countries": location_tree
    }


# =========================================================
# GET TENANT LOCATIONS (FOR RESUME)
# =========================================================

@router.get("/tenant-locations")
def get_tenant_locations(
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_or_create_driver),
):
    """
    Returns tenant countries + cities.
    Used for onboarding resume.
    Does NOT modify onboarding state.
    """

    if not driver.tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Driver has not selected a tenant yet."
        )

    location_tree = build_location_tree(db, driver.tenant_id)

    return {
        "tenant_id": driver.tenant_id,
        "countries": location_tree
    }


# =========================================================
#  SELECT LOCATION
# =========================================================

@router.post("/select-location")
def select_location(
    payload: SelectLocationSchema,
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_or_create_driver),
):

    block_if_completed(driver.onboarding_status, DRIVER_ONBOARDING_FLOW)


    if not driver.tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Tenant must be selected before selecting location."
        )

    tenant_country = (
        db.query(TenantCountry)
        .filter(
            TenantCountry.tenant_id == driver.tenant_id,
            TenantCountry.country_id == payload.country_id
        )
        .first()
    )

    if not tenant_country:
        raise HTTPException(
            status_code=400,
            detail="Country not available for selected tenant."
        )

    city = (
        db.query(City)
        .filter(
            City.city_id == payload.city_id,
            City.country_id == payload.country_id,
            City.is_active == True
        )
        .first()
    )

    if not city:
        raise HTTPException(
            status_code=404,
            detail="City not found or inactive."
        )

    tenant_city = (
        db.query(TenantCity)
        .filter(
            TenantCity.tenant_id == driver.tenant_id,
            TenantCity.city_id == payload.city_id
        )
        .first()
    )

    if not tenant_city:
        raise HTTPException(
            status_code=400,
            detail="City not available for selected tenant."
        )

    driver.country_id = payload.country_id
    driver.city_id = payload.city_id
    enforce_transition(
        driver.onboarding_status,
        DriverOnboardingStatus.LOCATION_SELECTED,
        DRIVER_ONBOARDING_FLOW
    )
  
    driver.onboarding_status = DriverOnboardingStatus.LOCATION_SELECTED

    db.commit()
    db.refresh(driver)

    return {
        "ok": True,
        "driver_id": driver.driver_id,
        "tenant_id": driver.tenant_id,
        "country_id": driver.country_id,
        "city_id": driver.city_id,
        "onboarding_status": driver.onboarding_status
    }


# =========================================================
#  UPDATE DRIVER TYPE
# =========================================================

@router.put("/driver-type")
def update_driver_type(
    payload: DriverTypeSchema,
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_or_create_driver),
):

    block_if_completed(driver.onboarding_status,DRIVER_ONBOARDING_FLOW)

    driver.driver_type = payload.driver_type
    enforce_transition(
        driver.onboarding_status,
        DriverOnboardingStatus.LOCATION_SELECTED,
        DRIVER_ONBOARDING_FLOW
    )


    
    driver.onboarding_status = DriverOnboardingStatus.DRIVER_TYPE_SELECTED


    db.commit()
    db.refresh(driver)

    return {
        "ok": True,
        "driver_type": driver.driver_type,
        "onboarding_status": driver.onboarding_status,
    }


# =========================================================
#  SUBMIT DOCUMENTS
# =========================================================

@router.post("/submit-documents")
def submit_documents(
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_or_create_driver),
):

    block_if_completed(driver.onboarding_status,DRIVER_ONBOARDING_FLOW)

    enforce_transition(
        driver.onboarding_status,
        DriverOnboardingStatus.LOCATION_SELECTED,
        DRIVER_ONBOARDING_FLOW
    )

    driver.onboarding_status = DriverOnboardingStatus.COMPLETED

    db.commit()
    db.refresh(driver)

    return SubmitDocumentsResponse(
        ok=True,
        driver_id=driver.driver_id,
        onboarding_status=driver.onboarding_status,
        message="Documents submitted successfully. Awaiting tenant approval."
    )
