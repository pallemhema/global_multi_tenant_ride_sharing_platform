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

from app.schemas.core.drivers.onboardin import OnboardingStatus


router = APIRouter(
    prefix="/driver",
    tags=["Driver – Onboarding"],
)


# =========================================================
# 🔒 HELPER FUNCTIONS
# =========================================================

ONBOARDING_FLOW = [
    OnboardingStatus.NOT_STARTED,
    OnboardingStatus.TENANT_SELECTED,
    OnboardingStatus.LOCATION_SELECTED,
    OnboardingStatus.DRIVER_TYPE_SELECTED,
    OnboardingStatus.COMPLETED,
]

def enforce_transition(driver: Driver, target_status: str):
    current_status = driver.onboarding_status or OnboardingStatus.NOT_STARTED

    if current_status == OnboardingStatus.COMPLETED:
        raise HTTPException(
            status_code=403,
            detail="Onboarding already completed. Changes not allowed."
        )

    current_index = ONBOARDING_FLOW.index(current_status)
    target_index = ONBOARDING_FLOW.index(target_status)

    # ❌ Prevent skipping forward
    if target_index > current_index + 1:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot skip onboarding steps: {current_status} → {target_status}"
        )

    # ✅ Allow:
    # - Same stage (edit)
    # - Going backward
    # - Moving to next stage

def block_if_completed(driver: Driver):
    if driver.onboarding_status == OnboardingStatus.COMPLETED:
        raise HTTPException(
            status_code=403,
            detail="Driver onboarding already completed."
        )


def build_location_tree(db: Session, tenant_id: int):
    tenant_countries = (
        db.query(TenantCountry)
        .filter(TenantCountry.tenant_id == tenant_id)
        .all()
    )

    location_tree = []

    for tc in tenant_countries:
        country = db.get(Country, tc.country_id)

        if not country:
            continue

        cities = (
            db.query(City)
            .join(TenantCity, TenantCity.city_id == City.city_id)
            .filter(
                TenantCity.tenant_id == tenant_id,
                City.country_id == country.country_id,
                City.is_active == True
            )
            .all()
        )

        location_tree.append({
            "country_id": country.country_id,
            "country_name": country.country_name,
            "cities": [
                {
                    "city_id": c.city_id,
                    "city_name": c.city_name
                }
                for c in cities
            ]
        })

    return location_tree


# =========================================================
# 1️⃣ SELECT TENANT
# =========================================================

@router.post("/select-tenant")
def select_tenant(
    payload: SelectTenantSchema,
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_or_create_driver),
):

    block_if_completed(driver)

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
    enforce_transition(driver, OnboardingStatus.TENANT_SELECTED)
    driver.onboarding_status = OnboardingStatus.TENANT_SELECTED


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
# 2️⃣ GET TENANT LOCATIONS (FOR RESUME)
# =========================================================

@router.get("/tenant-locations")
def get_tenant_locations(
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
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
# 3️⃣ SELECT LOCATION
# =========================================================

@router.post("/select-location")
def select_location(
    payload: SelectLocationSchema,
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_or_create_driver),
):

    block_if_completed(driver)

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
    enforce_transition(driver, OnboardingStatus.LOCATION_SELECTED)
    driver.onboarding_status = OnboardingStatus.LOCATION_SELECTED

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
# 4️⃣ UPDATE DRIVER TYPE
# =========================================================

@router.put("/driver-type")
def update_driver_type(
    payload: DriverTypeSchema,
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_or_create_driver),
):

    block_if_completed(driver)

    driver.driver_type = payload.driver_type
    enforce_transition(driver, OnboardingStatus.DRIVER_TYPE_SELECTED)
    driver.onboarding_status = OnboardingStatus.DRIVER_TYPE_SELECTED


    db.commit()
    db.refresh(driver)

    return {
        "ok": True,
        "driver_type": driver.driver_type,
        "onboarding_status": driver.onboarding_status,
    }


# =========================================================
# 5️⃣ SUBMIT DOCUMENTS
# =========================================================

@router.post("/submit-documents")
def submit_documents(
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
):

    block_if_completed(driver)

    enforce_transition(driver, OnboardingStatus.COMPLETED)
    driver.onboarding_status = OnboardingStatus.COMPLETED

    db.commit()
    db.refresh(driver)

    return SubmitDocumentsResponse(
        ok=True,
        driver_id=driver.driver_id,
        onboarding_status=driver.onboarding_status,
        message="Documents submitted successfully. Awaiting tenant approval."
    )
