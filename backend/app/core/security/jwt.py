from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/otp/verify")

def create_access_token(
    *,
    user_id: int,
    role: str,
    context: str,
    tenant_id: int | None = None,
    driver_id: int | None = None,
    fleet_owner_id: int | None = None,
):
    payload = {
        "sub": str(user_id),
        "role": role,
        "context": context,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }

    if role == "tenant-admin":
        payload["tenant_id"] = tenant_id

    if role == "driver":
        payload["driver_id"] = driver_id

    if role == "fleet-owner":
        payload["fleet_owner_id"] = fleet_owner_id

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

def verify_access_token(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        if payload.get("type") != "access":
            raise HTTPException(status_code=401)

        return payload

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )