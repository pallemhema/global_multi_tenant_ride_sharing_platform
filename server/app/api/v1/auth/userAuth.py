from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.models.core.users.users import User
from app.schemas.core.auth.otp import OTPVerifyRequest, OTPRequest
from app.core.security.auth_otp import generate_otp, store_otp, verify_otp
from app.core.utils.phone import normalize_phone

from app.core.security.jwt import create_access_token
from app.models.core.drivers.drivers import Driver
from app.models.core.tenants.tenant_staff import TenantStaff
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.core.security.jwt import verify_access_token

from app.models.core.users.user_profiles import UserProfile
from app.models.core.users.users import User
from app.schemas.core.users.user_profiles import UserProfileCreate,UserProfileOut

router = APIRouter(prefix="/auth/user", tags=["Auth"])

# -------------------------------
# OTP REQUEST
# -------------------------------

@router.post("/otp/request")
def request_otp_user(payload: OTPRequest):
    phone = normalize_phone(payload.phone_e164)
    otp = generate_otp()
    store_otp(phone, otp)
    return {"message": "OTP sent"}


# -------------------------------
# OTP VERIFY (NO JWT HERE)

@router.post("/otp/verify")
def otp_verify_user(
    payload: OTPVerifyRequest,
    db: Session = Depends(get_db),
):
    phone = normalize_phone(payload.phone_e164)

    if not verify_otp(phone, payload.otp):
        raise HTTPException(400, "Invalid OTP")

    user = db.query(User).filter(User.phone_e164 == phone).first()
    if not user:
        user = User(
            phone_e164=phone,
            phone_verified=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    user_id = user.user_id

    # -------------------------
    # DRIVER
    # -------------------------
    driver = db.query(Driver).filter(
        Driver.user_id == user_id,
        Driver.is_active.is_(True),
    ).first()

    if driver:
        return {
            "access_token": create_access_token(
                user_id=user_id,
                role="driver",
                context="user",
                driver_id=driver.driver_id,
            ),
            "token_type": "bearer",
        }

    # -------------------------
    # FLEET OWNER
    # -------------------------
    fleet = db.query(FleetOwner).filter(
        FleetOwner.user_id == user_id,
        FleetOwner.is_active.is_(True),
    ).first()

    if fleet:
        return {
            "access_token": create_access_token(
                user_id=user_id,
                role="fleet-owner",
                context="user",
                fleet_owner_id=fleet.fleet_owner_id,
            ),
            "token_type": "bearer",
        }

    # -------------------------
    # RIDER (DEFAULT)
    # -------------------------
    return {
        "access_token": create_access_token(
            user_id=user_id,
            role="rider",
            context="user",
        ),
        "token_type": "bearer",
    }


@router.post("/switch-role")
def switch_role(
    role: str,
    db: Session = Depends(get_db),
    user=Depends(verify_access_token),
):
    user_id = int(user["sub"])
    # --------------------
    # RIDER SWITCH (DEFAULT)
    # --------------------
    if user["context"] != "user":
        raise HTTPException(403, "Role switching not allowed")

    if role == "rider":
        return {
            "access_token": create_access_token(
                user_id=user_id,
                role="rider",
                context="user",
            ),
            "token_type": "bearer",
        }

    # --------------------
    # DRIVER SWITCH
    # --------------------
    if role == "driver":
        driver = db.query(Driver).filter(
            Driver.user_id == user_id,
        ).first()

        if not driver:
            raise HTTPException(403, "Driver role not available")

        return {
            "access_token": create_access_token(
                user_id=user_id,
                role="driver",
                context="user",
                driver_id=driver.driver_id,
            ),
            "token_type": "bearer",
        }

    # --------------------
    # FLEET OWNER SWITCH
    # --------------------
    if role == "fleet-owner":
        fleet = db.query(FleetOwner).filter(
            FleetOwner.user_id == user_id,
          
        ).first()

        if not fleet:
            raise HTTPException(403, "Fleet owner role not available")

        return {
            "access_token": create_access_token(
                user_id=user_id,
                role="fleet-owner",
                context="user",
                fleet_owner_id=fleet.fleet_owner_id,
            ),
            "token_type": "bearer",
            "onboarding_status": fleet.onboarding_status,
        }

    # --------------------
    # TENANT ADMIN SWITCH
    # --------------------
    if role == "tenant-admin":
        staff = db.query(TenantStaff).filter(
            TenantStaff.user_id == user_id,
            TenantStaff.role_code == "admin",
            
        ).first()

        if not staff:
            raise HTTPException(403, "Tenant admin role not available")

        return {
            "access_token": create_access_token(
                user_id=user_id,
                role="tenant-admin",
                context="tenant",
                tenant_id=staff.tenant_id,
            ),
            "token_type": "bearer",
        }

    raise HTTPException(400, "Invalid role")

@router.get("/available-roles")
def get_available_roles(
    db: Session = Depends(get_db),
    user=Depends(verify_access_token),
):
    user_id = int(user["sub"])
    current_role = user["role"]

    roles = []

    # ----------------------------------
    # TENANT ADMIN (exclusive to tenant)
    # ----------------------------------
    tenant_staff = db.query(TenantStaff).filter(
        TenantStaff.user_id == user_id,
        TenantStaff.role_code == "admin",
       
    ).all()

    if tenant_staff:
        return {
            "current_role": "tenant-admin",
            "roles": [
                {
                    "role": "tenant-admin",
                    "tenant_id": staff.tenant_id,
                }
                for staff in tenant_staff
            ],
        }

    # ----------------------------------
    # USER CONTEXT (DEFAULT = RIDER)
    # ----------------------------------
    roles.append({"role": "rider"})

    driver = db.query(Driver).filter(
        Driver.user_id == user_id,
    ).first()

    fleet = db.query(FleetOwner).filter(
        FleetOwner.user_id == user_id,
    ).first()
    print(fleet)

    if driver:
        roles.append({
            "role": "driver",
            "driver_id": driver.driver_id,
        })

    if fleet:
        roles.append({
            "role": "fleet-owner",
            "fleet_owner_id": fleet.fleet_owner_id,
            "onboarding_status": fleet.onboarding_status,
        })

    return {
        "current_role": current_role,
        "roles": roles,
    }


@router.get(
    "/profile",
    response_model=UserProfileOut
)
def get_user_profile(
    db: Session = Depends(get_db),
    user=Depends(verify_access_token)
):
    user_id = int(user["sub"])
  
    profile = (db.query(UserProfile)
        .filter(UserProfile.user_id == user_id)
        .first())
    if not profile:
        raise HTTPException(
            status_code=403,
            detail="User profile not found"
        )
    return profile

@router.post("/profile")
def create__user_profile(
    payload: UserProfileCreate,
    db: Session = Depends(get_db),
    user=Depends(verify_access_token)
):
    userId = int(user["sub"])
    userExist = (
        db.query(User)
        .filter(
            User.user_id == userId
        )
        .first()
    )
    
    if not userExist:
         raise HTTPException(
            status_code=403,
            detail="User not found"
        )
    
    profile = UserProfile(
            user_id=userId,
            **payload.model_dump()
        )
    
    db.add(profile)

    db.commit()
    db.refresh(profile)

    return profile

@router.put("/profile")
def update_user_profile(
    payload: UserProfileCreate,
    db: Session = Depends(get_db),
    user=Depends(verify_access_token),
):
    user_id = int(user["sub"])
    # Ensure user exists
    user_exist = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user_exist:
        raise HTTPException(
            status_code=403,
            detail="User not found"
        )

    # Fetch existing profile
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == user_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="User profile not found"
        )

    # Update fields
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile




