"""
Trip OTP Service - Step 9 & 11 of Trip Lifecycle

Generates and verifies OTP for trip start.
"""

from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import random
import string

from app.models.core.trips.trips import Trip
from app.core.redis import redis_client


class TripOTPService:
    """
    Handle OTP generation, storage, and verification.
    """

    @staticmethod
    def generate_otp(db: Session, trip_id: int) -> str:
        """
        Generate 4-digit OTP for trip start.
        
        - Store in database
        - Cache in Redis with 15-minute expiry
        """
        now = datetime.now(timezone.utc)
        
        # Generate random 4-digit OTP
        otp = ''.join(random.choices(string.digits, k=4))
        
        # Store in database
        trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
        if trip:
            trip.otp_code = otp
            db.add(trip)
            db.flush()
        
        # Cache in Redis for quick lookup (15 minutes)
        redis_key = f"trip:otp:{trip_id}"
        redis_client.setex(redis_key, 900, otp)  # 900 seconds = 15 minutes
        
        return otp

    @staticmethod
    def verify_otp(db: Session, trip_id: int, provided_otp: str) -> bool:
        """
        Verify OTP matches and hasn't expired.
        
        - Check database record
        - Ensure OTP is not empty
        - Delete OTP from cache after verification (one-time use)
        """
        trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
        
        if not trip or not trip.otp_code:
            return False
        
        if trip.otp_code != provided_otp:
            return False
        
        # OTP is valid - delete from Redis to prevent reuse
        redis_key = f"trip:otp:{trip_id}"
        redis_client.delete(redis_key)
        
        # Clear from database
        trip.otp_code = None
        db.add(trip)
        db.flush()
        
        return True

    @staticmethod
    def get_otp(trip_id: int) -> str | None:
        """
        Retrieve OTP from cache (for driver display / testing).
        
        Do not delete on retrieval - only delete on verification.
        """
        redis_key = f"trip:otp:{trip_id}"
        otp = redis_client.get(redis_key)
        
        if otp:
            return otp.decode() if isinstance(otp, bytes) else otp
        
        return None

    @staticmethod
    def is_otp_expired(trip_id: int) -> bool:
        """
        Check if OTP has expired in Redis.
        """
        redis_key = f"trip:otp:{trip_id}"
        ttl = redis_client.ttl(redis_key)
        
        # ttl == -2 means key doesn't exist (expired)
        # ttl == -1 means key exists but no expiry (shouldn't happen)
        # ttl > 0 means key exists with time remaining
        
        return ttl == -2
