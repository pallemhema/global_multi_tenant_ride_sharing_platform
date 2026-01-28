# app/api/v1/drivers/onboarding.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import get_or_create_driver, require_driver
from app.models.core.drivers.drivers import Driver
from app.models.core.tenants.tenants import Tenant
from app.schemas.core.drivers.onboarding import SelectTenantSchema, DriverTypeSchema, SubmitDocumentsResponse

router = APIRouter(
    prefix="/driver",
    tags=["Driver – Onboarding"],
)

@router.post("/select-tenant")
def select_tenant(
    payload: SelectTenantSchema,
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_or_create_driver),
):
    
    # ❌ Block if onboarding already completed
    if driver.onboarding_status == "completed":
        raise HTTPException(
            status_code=403,
            detail="Driver onboarding already completed. Tenant cannot be changed."
        )

    # ✅ Verify tenant exists
    tenant = db.query(Tenant).filter(Tenant.tenant_id == payload.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )

    # ✅ Update tenant
    driver.tenant_id = payload.tenant_id
    db.commit()
    db.refresh(driver)

    return {
        "ok": True,
        "driver_id": driver.driver_id,
        "tenant_id": driver.tenant_id,
        "onboarding_status": driver.onboarding_status,
    }

@router.put("/driver-type")
def update_driver_type(
    payload: DriverTypeSchema,
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_or_create_driver),
):
  
    
    # ❌ Block if onboarding already completed
    if driver.onboarding_status == "completed":
        raise HTTPException(
            status_code=403,
            detail="Driver onboarding already completed. Driver type cannot be changed."
        )

    driver.driver_type = payload.driver_type
    db.commit()
    db.refresh(driver)

    return {
        "ok": True,
        "driver_type": driver.driver_type,
        "onboarding_status": driver.onboarding_status,
    }

@router.post("/submit-documents")
def submit_documents(
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
):
    """
    Submit documents to complete onboarding.
    
    Rules:
    - Marks onboarding as completed
    - Locks tenant and driver type selection
    - Documents remain editable until tenant approval
    """
    
    # ❌ Block if already completed
    if driver.onboarding_status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Onboarding already completed"
        )
    
    # ✅ Mark onboarding as completed
    driver.onboarding_status = "completed"
    db.commit()
    db.refresh(driver)

    return SubmitDocumentsResponse(
        ok=True,
        driver_id=driver.driver_id,
        onboarding_status=driver.onboarding_status,
        message="Documents submitted successfully. Awaiting tenant approval."
    )
