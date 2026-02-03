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
    print(f"[OTP STORE] trip_id={trip_id} → otp={otp}")

    # store hashed OTP for verification
    try:
        redis_client.setex(
            _otp_key(trip_id),
            OTP_TTL_SECONDS,
            _hash_otp(otp),
        )
        print(f"[OTP STORE] Hashed OTP stored in Redis for trip_id={trip_id}, TTL={OTP_TTL_SECONDS}s")
    except Exception as e:
        print(f"[OTP STORE] ERROR storing hashed OTP: {e}")
        raise
    
    try:
        redis_client.setex(
            _attempts_key(trip_id),
            OTP_TTL_SECONDS,
            0,
        )
        print(f"[OTP STORE] Attempt counter reset for trip_id={trip_id}")
    except Exception as e:
        print(f"[OTP STORE] ERROR resetting attempts: {e}")
        raise

    # Always store plaintext OTP so riders can see it (for development & testing)
    try:
        redis_client.setex(_otp_plain_key(trip_id), OTP_TTL_SECONDS, otp)
        print(f"[OTP STORE] Plaintext OTP stored in Redis for trip_id={trip_id}")
    except Exception as e:
        print(f"[OTP STORE] ERROR storing plaintext OTP: {e}")
        raise


def verify_trip_otp(trip_id: int, otp: str) -> bool:
    try:
        stored = redis_client.get(_otp_key(trip_id))
    except Exception as e:
        print(f"[OTP VERIFY] ERROR reading OTP hash from Redis for trip_id={trip_id}: {e}")
        return False
    
    if not stored:
        print(f"[OTP VERIFY] No stored OTP found for trip_id={trip_id}")
        return False

    try:
        attempts = int(redis_client.get(_attempts_key(trip_id)) or 0)
    except Exception as e:
        print(f"[OTP VERIFY] ERROR reading attempt count for trip_id={trip_id}: {e}")
        attempts = 0

    if attempts >= MAX_OTP_ATTEMPTS:
        print(f"[OTP VERIFY] Max attempts ({MAX_OTP_ATTEMPTS}) exceeded for trip_id={trip_id}")
        try:
            redis_client.delete(_otp_key(trip_id))
            redis_client.delete(_attempts_key(trip_id))
        except Exception as e:
            print(f"[OTP VERIFY] ERROR deleting expired OTP for trip_id={trip_id}: {e}")
        return False

    if _hash_otp(otp) != stored:
        print(f"[OTP VERIFY] OTP mismatch for trip_id={trip_id}, attempts={attempts}")
        try:
            redis_client.incr(_attempts_key(trip_id))
        except Exception as e:
            print(f"[OTP VERIFY] ERROR incrementing attempts for trip_id={trip_id}: {e}")
        return False

    # Success - delete the OTP
    print(f"[OTP VERIFY] OTP verified successfully for trip_id={trip_id}")
    try:
        redis_client.delete(_otp_key(trip_id))
        redis_client.delete(_attempts_key(trip_id))
    except Exception as e:
        print(f"[OTP VERIFY] ERROR deleting verified OTP for trip_id={trip_id}: {e}")
    
    return True
