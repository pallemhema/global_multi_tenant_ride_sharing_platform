from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.dependencies import get_db
from app.core.security.roles import get_or_create_fleet_owner, ensure_user_can_be_fleet_owner
from app.core.security.jwt import verify_access_token

from app.models.core.tenants.tenants import Tenant
from app.models.core.fleet_owners.fleet_owners import FleetOwner




class SelectTenantPayload(BaseModel):
    tenant_id: int


class FleetDetailsPayload(BaseModel):
    business_name: str
    contact_email: str | None = None

router = APIRouter(
    tags=["Fleet Owner – Onboarding"],
)



@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_fleet_owner(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
):
    """
    FIRST STEP: Register as Fleet Owner
    When user clicks "Fleet Registration" button, check if they're eligible.
    - If user is already a driver or tenant staff: REJECT
    - If user is new: Create/return fleet with onboarding_status='draft'
    
    This endpoint has stricter checks than get_or_create_fleet_owner
    because it's the explicit registration action.
    """
    user_id = int(user.get("sub"))
    
    # Check if user can be a fleet owner (not already driver/tenant staff)
    ensure_user_can_be_fleet_owner(db, user_id)
    
    # Get or create fleet owner
    fleet_owner = get_or_create_fleet_owner(
        db=db,
        user=user
    )
    
    return {
        "status": "registration_created",
        "fleet_owner_id": fleet_owner.fleet_owner_id,
        "onboarding_status": fleet_owner.onboarding_status,
        "next_step": "select_tenant",
    }


@router.post("/select-tenant", status_code=status.HTTP_200_OK)
def select_tenant_for_fleet_owner(
    payload: SelectTenantPayload,
    db: Session = Depends(get_db),
    fleet_owner: FleetOwner = Depends(get_or_create_fleet_owner),
):
    """
    SECOND STEP:
    User selects a tenant to join as fleet owner.
    Validates and locks the tenant permanently.
    
    If tenant is already selected during draft/pending onboarding,
    just returns the existing selection.
    """
    # Refresh to get latest data
    db.refresh(fleet_owner)
    
    # Check if onboarding already completed
    if fleet_owner.onboarding_status == "completed":
        raise HTTPException(
            status_code=403,
            detail="Fleet owner onboarding already completed. Tenant cannot be changed."
        )

    # Check if tenant already selected (during draft/pending, just return it)
    if fleet_owner.tenant_id:
        # If same tenant being selected again, that's fine - just return success
        if fleet_owner.tenant_id == payload.tenant_id:
            return {
                "status": "tenant_already_selected",
                "fleet_owner_id": fleet_owner.fleet_owner_id,
                "tenant_id": fleet_owner.tenant_id,
                "next_step": "fill_details",
            }
        # If trying to change tenant during draft, reject it
        elif fleet_owner.onboarding_status in ["draft", "pending"]:
            raise HTTPException(
                status_code=400,
                detail="Cannot change tenant once selected. Please complete onboarding or contact support."
            )
        else:
            raise HTTPException(
                status_code=403,
                detail="Tenant already selected. Cannot change."
            )

    # 1️⃣ Validate tenant exists and is active
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
            status_code=400,
            detail="Tenant is not active or not approved",
        )

    # 2️⃣ Update FleetOwner with tenant
    fleet_owner.tenant_id = payload.tenant_id
    db.add(fleet_owner)
    db.commit()
    db.refresh(fleet_owner)

    return {
        "status": "tenant_selected",
        "fleet_owner_id": fleet_owner.fleet_owner_id,
        "tenant_id": fleet_owner.tenant_id,
        "next_step": "fill_details",
    }


@router.post("/upload-fleet-details", status_code=status.HTTP_200_OK)
def fill_fleet_details(
    payload: FleetDetailsPayload,
    db: Session = Depends(get_db),
    fleet_owner: FleetOwner = Depends(get_or_create_fleet_owner),
):
    """
    THIRD STEP:
    User fills in fleet business details.
    Updates business_name and contact_email.
    """
    # Validate tenant is selected
    if not fleet_owner.tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Please select a tenant first",
        )

    # Update fleet details
    fleet_owner.business_name = payload.business_name
    fleet_owner.contact_email = payload.contact_email
    db.add(fleet_owner)
    db.commit()
    db.refresh(fleet_owner)

    return {
        "status": "details_saved",
        "fleet_owner_id": fleet_owner.fleet_owner_id,
        "business_name": fleet_owner.business_name,
        "contact_email": fleet_owner.contact_email,
        "onboarding_status": fleet_owner.onboarding_status,
        "next_step": "upload_documents",
    }


# @router.get("/status", status_code=status.HTTP_200_OK)
# def get_fleet_onboarding_status(
#     db: Session = Depends(get_db),
#     fleet_owner: FleetOwner = Depends(get_or_create_fleet_owner),
# ):
#     """
#     Get current onboarding status and details.
#     """
#     print(fleet_owner)
#     return {
#         "fleet_owner_id": fleet_owner.fleet_owner_id,
#         "business_name": fleet_owner.business_name,
#         "contact_email": fleet_owner.contact_email,
#         "tenant_id": fleet_owner.tenant_id,
#         "onboarding_status": fleet_owner.onboarding_status,
#         "approval_status": fleet_owner.approval_status,
#         "is_active": fleet_owner.is_active,
#     }


