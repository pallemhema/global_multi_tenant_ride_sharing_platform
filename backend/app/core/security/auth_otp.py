import hashlib
import secrets
from app.core.redis import redis_client

OTP_TTL_SECONDS = 300
MAX_OTP_ATTEMPTS = 5


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _otp_key(phone: str) -> str:
    return f"otp:{phone}"


def _attempts_key(phone: str) -> str:
    return f"otp_attempts:{phone}"


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def store_otp(phone: str, otp: str) -> None:
    # DEV ONLY
    print(f"[DEV OTP] {phone} → {otp}")

    redis_client.setex(_otp_key(phone), OTP_TTL_SECONDS, _hash_otp(otp))
    redis_client.setex(_attempts_key(phone), OTP_TTL_SECONDS, 0)


def verify_otp(phone: str, otp: str) -> bool:
    stored = redis_client.get(_otp_key(phone))
    if not stored:
        return False

    attempts = int(redis_client.get(_attempts_key(phone)) or 0)

    if attempts >= MAX_OTP_ATTEMPTS:
        redis_client.delete(_otp_key(phone))
        redis_client.delete(_attempts_key(phone))
        return False

    if _hash_otp(otp) != stored:
        redis_client.incr(_attempts_key(phone))
        return False

    redis_client.delete(_otp_key(phone))
    redis_client.delete(_attempts_key(phone))
    return True
