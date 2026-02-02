import hashlib
import secrets
import os
from app.core.redis import redis_client

OTP_TTL_SECONDS = 1800
MAX_OTP_ATTEMPTS = 5


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _otp_key(trip_id: int) -> str:
    return f"trip:otp:{trip_id}"


def _otp_plain_key(trip_id: int) -> str:
    return f"trip:otp:plain:{trip_id}"


def _attempts_key(trip_id: int) -> str:
    return f"trip:otp_attempts:{trip_id}"


def generate_trip_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def store_trip_otp(trip_id: int, otp: str) -> None:
    # Print OTP for development (visible in server logs)
    print(f"[TRIP OTP] trip_id={trip_id} → {otp}")

    # store hashed OTP for verification
    redis_client.setex(
        _otp_key(trip_id),
        OTP_TTL_SECONDS,
        _hash_otp(otp),
    )
    redis_client.setex(
        _attempts_key(trip_id),
        OTP_TTL_SECONDS,
        0,
    )

    # Always store plaintext OTP so riders can see it (for development & testing)
    redis_client.setex(_otp_plain_key(trip_id), OTP_TTL_SECONDS, otp)


def verify_trip_otp(trip_id: int, otp: str) -> bool:
    stored = redis_client.get(_otp_key(trip_id))
    if not stored:
        return False

    attempts = int(redis_client.get(_attempts_key(trip_id)) or 0)

    if attempts >= MAX_OTP_ATTEMPTS:
        redis_client.delete(_otp_key(trip_id))
        redis_client.delete(_attempts_key(trip_id))
        return False

    if _hash_otp(otp) != stored:
        redis_client.incr(_attempts_key(trip_id))
        return False

    redis_client.delete(_otp_key(trip_id))
    redis_client.delete(_attempts_key(trip_id))
    return True
