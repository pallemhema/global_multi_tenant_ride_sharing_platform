"""
Batch Manager - Step 7 of Trip Lifecycle

Handles iterative batch creation with radius expansion and timeout management.
Triggers next batch when current batch is exhausted without acceptance.
"""

from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.core.trips.trip_request import TripRequest
from app.models.core.trips.trip_batch import TripBatch
from app.models.core.trips.trip_dispatch_candidates import TripDispatchCandidate
from app.core.redis import redis_client


# Batch configuration: Radius expansion + timeout windows
BATCH_CONFIG = [
    {
        "batch_number": 1,
        "radius_km": 3.0,
        "max_drivers": 5,
        "timeout_sec": 15,
    },
    {
        "batch_number": 2,
        "radius_km": 6.0,
        "max_drivers": 8,
        "timeout_sec": 20,
    },
    {
        "batch_number": 3,
        "radius_km": 10.0,
        "max_drivers": 12,
        "timeout_sec": 25,
    },
]


class BatchManager:
    """
    Manage batch-wise dispatch lifecycle.
    """

    @staticmethod
    def get_next_batch_config(current_batch_number: int) -> dict | None:
        """
        Return config for next batch, or None if exhausted.
        """
        for config in BATCH_CONFIG:
            if config["batch_number"] == current_batch_number + 1:
                return config
        
        return None

    @staticmethod
    def create_batch(
        db: Session,
        trip_request_id: int,
        tenant_id: int,
        batch_number: int,
    ) -> TripBatch:
        """
        Create a new batch record with config.
        """
        config = BATCH_CONFIG[batch_number - 1] if batch_number <= len(BATCH_CONFIG) else None
        
        if not config:
            raise ValueError(f"Batch {batch_number} not configured")
        
        now = datetime.now(timezone.utc)
        
        batch = TripBatch(
            trip_request_id=trip_request_id,
            tenant_id=tenant_id,
            batch_number=batch_number,
            batch_status="pending",
            search_radius_km=config["radius_km"],
            max_drivers_in_batch=config["max_drivers"],
            timeout_seconds=config["timeout_sec"],
            created_at_utc=now,
        )
        
        db.add(batch)
        db.flush()
        
        return batch

    @staticmethod
    def mark_batch_active(db: Session, batch_id: int):
        """
        Mark batch as active (dispatch started).
        """
        now = datetime.now(timezone.utc)
        
        batch = db.query(TripBatch).filter(TripBatch.trip_batch_id == batch_id).first()
        if batch:
            batch.batch_status = "active"
            batch.started_at_utc = now
            db.add(batch)
            db.flush()

    @staticmethod
    def check_batch_exhaustion(db: Session, batch_id: int) -> bool:
        """
        Check if all drivers in batch have responded.
        
        Returns True if exhausted (all drivers responded).
        """
        pending_count = db.query(TripDispatchCandidate).filter(
            TripDispatchCandidate.trip_batch_id == batch_id,
            TripDispatchCandidate.response_code == "pending",
        ).count()
        
        return pending_count == 0

    @staticmethod
    def mark_batch_completed(db: Session, batch_id: int):
        """
        Mark batch as completed (either accepted or exhausted).
        """
        now = datetime.now(timezone.utc)
        
        batch = db.query(TripBatch).filter(TripBatch.trip_batch_id == batch_id).first()
        if batch:
            batch.batch_status = "completed"
            batch.ended_at_utc = now
            db.add(batch)
            db.flush()

    @staticmethod
    def mark_batch_no_acceptance(db: Session, batch_id: int):
        """
        Mark batch as exhausted without any acceptance.
        """
        now = datetime.now(timezone.utc)
        
        batch = db.query(TripBatch).filter(TripBatch.trip_batch_id == batch_id).first()
        if batch:
            batch.batch_status = "no_acceptance"
            batch.ended_at_utc = now
            db.add(batch)
            db.flush()

    @staticmethod
    def should_trigger_next_batch(db: Session, trip_request_id: int) -> bool:
        """
        Check if next batch should be triggered.
        
        Conditions:
        - Current batch is exhausted (all drivers responded)
        - No driver accepted yet
        - More batches available
        """
        # Get trip request
        trip_request = db.query(TripRequest).filter(
            TripRequest.trip_request_id == trip_request_id
        ).first()
        
        if not trip_request:
            return False
        
        # Check if trip already has a driver assigned
        if trip_request.status in ["driver_assigned", "completed", "cancelled"]:
            return False
        
        # Get latest batch
        latest_batch = db.query(TripBatch).filter(
            TripBatch.trip_request_id == trip_request_id
        ).order_by(TripBatch.batch_number.desc()).first()
        
        if not latest_batch:
            return False
        
        # Check if current batch is exhausted
        is_exhausted = BatchManager.check_batch_exhaustion(db, latest_batch.trip_batch_id)
        
        if not is_exhausted:
            return False
        
        # Check if more batches available
        next_config = BatchManager.get_next_batch_config(latest_batch.batch_number)
        
        return next_config is not None

    @staticmethod
    def trigger_next_batch(
        db: Session,
        trip_request_id: int,
    ) -> TripBatch | None:
        """
        Create and activate next batch if conditions met.
        
        Returns new batch or None if no more batches.
        """
        # Get trip request
        trip_request = db.query(TripRequest).filter(
            TripRequest.trip_request_id == trip_request_id
        ).first()
        
        if not trip_request:
            return None
        
        # Get latest batch
        latest_batch = db.query(TripBatch).filter(
            TripBatch.trip_request_id == trip_request_id
        ).order_by(TripBatch.batch_number.desc()).first()
        
        if not latest_batch:
            return None
        
        # Get next config
        next_config = BatchManager.get_next_batch_config(latest_batch.batch_number)
        
        if not next_config:
            return None
        
        # Create next batch
        next_batch = BatchManager.create_batch(
            db=db,
            trip_request_id=trip_request_id,
            tenant_id=trip_request.selected_tenant_id,
            batch_number=next_config["batch_number"],
        )
        
        BatchManager.mark_batch_active(db, next_batch.trip_batch_id)
        
        return next_batch
