from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_dispatch_rounds import TripDispatchRound
from app.models.core.trips.trip_dispatch_candidates import TripDispatchCandidate
from app.models.core.trips.trip_status_history import TripStatusHistory
from app.core.redis import redis_client
DISPATCH_ROUNDS = [
    {"radius_km": 3,  "max_drivers": 5,  "timeout_sec": 15},
    {"radius_km": 6,  "max_drivers": 8,  "timeout_sec": 20},
    {"radius_km": 10, "max_drivers": 12, "timeout_sec": 25},
]
def trigger_next_dispatch_round(db: Session, trip_id: int):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip or trip.trip_status != "dispatching":
        return

    # Find last round
    last_round = (
        db.query(TripDispatchRound)
        .filter(TripDispatchRound.trip_id == trip_id)
        .order_by(TripDispatchRound.round_no.desc())
        .first()
    )

    next_round_no = last_round.round_no + 1

    if next_round_no > len(DISPATCH_CONFIG):
        # 🚨 All rounds exhausted
        trip.trip_status = "cancelled"
        db.add(
            TripStatusHistory(
                tenant_id=trip.tenant_id,
                trip_id=trip.trip_id,
                from_status="dispatching",
                to_status="cancelled",
                changed_at_utc=datetime.utcnow(),
                changed_by=None,
            )
        )
        db.commit()
        return

    cfg = DISPATCH_CONFIG[next_round_no - 1]

    # 🔍 Fetch drivers again (larger radius)
    geo_key = f"drivers:geo:{trip.tenant_id}:{trip.city_id}"

    driver_ids = redis_client.georadius(
        geo_key,
        trip.pickup_longitude,
        trip.pickup_latitude,
        radius=cfg["radius_km"],
        unit="km",
        count=cfg["max_drivers"],
        sort="ASC",
    )

    if not driver_ids:
        return

    driver_ids = [int(d) for d in driver_ids]

    # Create round
    new_round = TripDispatchRound(
        tenant_id=trip.tenant_id,
        trip_id=trip.trip_id,
        round_no=next_round_no,
        search_radius_km=cfg["radius_km"],
        started_at_utc=datetime.utcnow(),
    )
    db.add(new_round)
    db.flush()

    # Create candidates
    candidates = [
        TripDispatchCandidate(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            round_id=new_round.round_id,
            driver_id=d_id,
            request_sent_at_utc=datetime.utcnow(),
        )
        for d_id in driver_ids
    ]

    db.add_all(candidates)
    db.commit()

    # Notify first driver
    redis_client.publish(
        f"driver:trip_request:{driver_ids[0]}",
        str(trip.trip_id),
    )

def is_round_exhausted(db: Session, round_id: int) -> bool:
    """
    Returns True if:
    - all candidates responded
    - and none accepted
    """

    candidates = (
        db.query(TripDispatchCandidate)
        .filter(TripDispatchCandidate.round_id == round_id)
        .all()
    )

    if not candidates:
        return True

    for c in candidates:
        if c.response_code is None:
            return False  # still waiting

        if c.response_code == "accepted":
            return False  # round succeeded

    return True  # all rejected / timeout

