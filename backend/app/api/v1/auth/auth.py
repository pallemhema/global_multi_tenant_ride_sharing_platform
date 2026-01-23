from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.models.core.users.users import User
from app.schemas.core.auth.otp import OTPVerifyRequest, OTPRequest
from app.core.security.auth_otp import generate_otp, store_otp, verify_otp
from app.core.utils.phone import normalize_phone

from app.core.security.jwt import create_access_token
from app.models.core.users.user_roles import UserRole
from app.models.core.drivers.drivers import Driver
from app.models.core.tenants.tenant_staff import TenantStaff
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.core.security.jwt import verify_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

# -------------------------------
# OTP REQUEST
# -------------------------------

@router.post("/otp/request")
def request_otp(payload: OTPRequest):
    phone = normalize_phone(payload.phone_e164)
    otp = generate_otp()
    store_otp(phone, otp)
    return {"message": "OTP sent"}


# -------------------------------
# OTP VERIFY (NO JWT HERE)

@router.post("/otp/verify")
def otp_verify(
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

    # ====================================================
    # 1️⃣ APP ADMIN (ABSOLUTE, PLATFORM ONLY)
    # ====================================================
    is_app_admin = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role == "app-admin",
    ).first()

    if is_app_admin:
        return {
            "access_token": create_access_token(
                user_id=user_id,
                role="app-admin",
                context="platform",
            ),
            "token_type": "bearer",
        }

    # ====================================================
    # 2️⃣ TENANT ADMIN (EXCLUSIVE, NO RIDER)
    # ====================================================
    staff = db.query(TenantStaff).filter(
        TenantStaff.user_id == user_id,
        TenantStaff.role_code == "admin",
        TenantStaff.status == "active",
    ).first()

    if staff:
        return {
            "access_token": create_access_token(
                user_id=user_id,
                role="tenant-admin",
                context="tenant",
                tenant_id=staff.tenant_id,
            ),
            "token_type": "bearer",
        }

    # ====================================================
    # 3️⃣ DRIVER OR FLEET OWNER (USER CONTEXT)
    # ====================================================
    driver = db.query(Driver).filter(
        Driver.user_id == user_id,
        Driver.is_active.is_(True),
    ).first()

    fleet = db.query(FleetOwner).filter(
        FleetOwner.user_id == user_id,
        FleetOwner.is_active.is_(True),
    ).first()

    if driver and fleet:
        raise HTTPException(
            500,
            "Invalid state: user cannot be driver and fleet-owner",
        )

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

    # ====================================================
    # 4️⃣ RIDER (DEFAULT FALLBACK)
    # ====================================================
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
            Driver.is_active.is_(True),
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
            FleetOwner.is_active.is_(True),
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
        }

    # --------------------
    # TENANT ADMIN SWITCH
    # --------------------
    if role == "tenant-admin":
        staff = db.query(TenantStaff).filter(
            TenantStaff.user_id == user_id,
            TenantStaff.role_code == "admin",
            TenantStaff.status == "active",
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

    # -----------------------------
    # PLATFORM ADMIN (exclusive)
    # -----------------------------
    if db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role == "app-admin",
    ).first():
        return {
            "current_role": "app-admin",
            "roles": [
                {"role": "app-admin"}
            ],
        }

    # -----------------------------
    # TENANT ADMIN (exclusive)
    # -----------------------------
    tenant_staff = db.query(TenantStaff).filter(
        TenantStaff.user_id == user_id,
        TenantStaff.role_code == "admin",
        TenantStaff.status == "active",
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

    # -----------------------------
    # USER CONTEXT (rider default)
    # -----------------------------
    roles.append({"role": "rider"})

    driver = db.query(Driver).filter(
        Driver.user_id == user_id,
        Driver.is_active.is_(True),
    ).first()

    fleet = db.query(FleetOwner).filter(
        FleetOwner.user_id == user_id,
        FleetOwner.is_active.is_(True),
    ).first()

    # Enforce mutual exclusivity
    if driver and fleet:
        raise HTTPException(
            500,
            "Invalid state: driver and fleet-owner together",
        )

    if driver:
        roles.append({
            "role": "driver",
            "driver_id": driver.driver_id,
        })

    if fleet:
        roles.append({
            "role": "fleet-owner",
            "fleet_owner_id": fleet.fleet_owner_id,
        })

    return {
        "current_role": current_role,
        "roles": roles,
    }
