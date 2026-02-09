from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.core.users.users import User
from app.models.core.tenants.tenant_staff import TenantStaff
from app.schemas.core.admins.admin_login import AdminLoginRequest
from app.core.security.password import verify_password
from app.core.security.jwt import create_access_token

router = APIRouter(prefix="/auth/admin", tags=["Admin Auth"])


@router.post("/login")
def admin_login(
    payload: AdminLoginRequest,
    db: Session = Depends(get_db),
):
    # 1️⃣ Fetch user by email
    user = (
        db.query(User)
        .filter(
            User.email == payload.email,
            User.email_verified.is_(True),
            User.is_active.is_(True),
        )
        .first()
    )

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2️⃣ Verify password
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    bool_value = user.is_app_admin
    print(bool_value)
    # 3️⃣ PLATFORM ADMIN
    if bool_value:
        return {
            "access_token": create_access_token(
                user_id=user.user_id,
                role="app-admin",
                context="platform",
            ),
            "token_type": "bearer",
        }

    # 4️⃣ TENANT ADMIN
    staff = (
        db.query(TenantStaff)
        .filter(
            TenantStaff.user_id == user.user_id,
            TenantStaff.role_code == "admin",
            TenantStaff.status == "active",
        )
        .first()
    )

    if not staff:
        raise HTTPException(status_code=403, detail="Admin access denied")

    return {
        "access_token": create_access_token(
            user_id=user.user_id,
            role="tenant-admin",
            context="tenant",
            tenant_id=staff.tenant_id,
        ),
        "token_type": "bearer",
    }
