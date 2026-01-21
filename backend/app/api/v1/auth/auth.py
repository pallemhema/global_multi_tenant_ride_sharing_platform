from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from app.core.dependencies import get_db
from app.models.core.users.users import User
from app.schemas.core.auth.otp import OTPVerifyRequest,OTPRequest
from app.core.security.auth_otp import generate_otp, store_otp, verify_otp
from app.core.security.jwt import create_access_token
from app.core.utils.phone import normalize_phone

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/otp/request")


@router.post("/otp/request")
def request_otp(payload: OTPRequest):
    phone = normalize_phone(payload.phone_e164)
    otp = generate_otp()
    store_otp(phone, otp)
    return {"message": "OTP sent"}


@router.post("/otp/verify")
def otp_verify(
    payload: OTPVerifyRequest,
    db: Session = Depends(get_db),
):
    phone = normalize_phone(payload.phone_e164)

    # 1️⃣ Verify OTP (normalized)
    if not verify_otp(phone, payload.otp):
        raise HTTPException(400, "Invalid OTP")

    # 2️⃣ Find user (normalized)
    user = (
        db.query(User)
        .filter(User.phone_e164 == phone)
        .first()
    )

    is_new_user = False

    # 3️⃣ Auto-create if not exists (normalized)
    if not user:
        user = User(
            phone_e164=phone,
            phone_verified=True,
            user_role="rider",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True
    else:
        user.last_login_utc = datetime.now(timezone.utc)
        db.commit()

    # 4️⃣ Create JWT
    token = create_access_token(
        user_id=user.user_id,
        role=user.user_role,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "is_new_user": is_new_user,
    }
