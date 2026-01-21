from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_user
from app.core.redis import redis_client

from app.models.core.users.users import User
from app.models.core.riders.riders import Rider
from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_status_history import TripStatusHistory
from app.models.core.trips.trip_dispatch_rounds import TripDispatchRound
from app.models.core.trips.trip_dispatch_candidates import TripDispatchCandidate
from app.models.core.tenants.tenant_cities import TenantCity

from app.schemas.core.trips.trips import TripRequestCreate

router = APIRouter(
    prefix="/rider/trips",
    tags=["Rider – Trips"],
)
DISPATCH_CONFIG = [
    {"radius_km": 3, "max_drivers": 5, "timeout_sec": 15},
    {"radius_km": 6, "max_drivers": 8, "timeout_sec": 20},
    {"radius_km": 10, "max_drivers": 12, "timeout_sec": 25},
]


@router.post("/request")
def request_trip(
    payload: TripRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    now = datetime.now(timezone.utc)

    # ------------------------------------------------------------------
    # 1️⃣ Validate tenant(s) operating in city
    # ------------------------------------------------------------------
    tenant_rows = (
        db.query(TenantCity.tenant_id)
        .filter(
            TenantCity.city_id == payload.city_id,
            TenantCity.is_active.is_(True),
        )
        .all()
    )

    if not tenant_rows:
        raise HTTPException(400, "Service not available in this city")

    tenant_ids = [t.tenant_id for t in tenant_rows]

    # ------------------------------------------------------------------
    # 2️⃣ Auto-select tenant that has nearby drivers
    # ------------------------------------------------------------------
    selected_tenant_id = None

    for t_id in tenant_ids:
        geo_key = f"drivers:geo:{t_id}:{payload.city_id}"

        drivers = redis_client.georadius(
            geo_key,
            payload.pickup_longitude,
            payload.pickup_latitude,
            radius=3,
            unit="km",
            count=1,
            sort="ASC",
        )

        if drivers:
            selected_tenant_id = t_id
            break

    if not selected_tenant_id:
        raise HTTPException(404, "No nearby drivers available")

    # ------------------------------------------------------------------
    # 3️⃣ Find or create Rider (tenant-scoped)
    # ------------------------------------------------------------------
    rider = (
        db.query(Rider)
        .filter(
            Rider.tenant_id == selected_tenant_id,
            Rider.user_id == user.user_id,
        )
        .first()
    )

    if rider:
        if not rider.is_active:
            raise HTTPException(403, "Rider blocked for this tenant")
    else:
        rider = Rider(
            tenant_id=selected_tenant_id,
            user_id=user.user_id,
            default_city_id=payload.city_id,
            is_active=True,
            created_by=user.user_id,
        )
        db.add(rider)
        db.flush()

    # ------------------------------------------------------------------
    # 4️⃣ Create Trip (REQUESTED)
    # ------------------------------------------------------------------
    trip = Trip(
        tenant_id=selected_tenant_id,
        rider_id=rider.rider_id,
        city_id=payload.city_id,
        trip_status="requested",
        pickup_latitude=payload.pickup_latitude,
        pickup_longitude=payload.pickup_longitude,
        drop_latitude=payload.drop_latitude,
        drop_longitude=payload.drop_longitude,
        requested_at_utc=now,
        created_by=user.user_id,
    )
    db.add(trip)
    db.flush()

    # Status history: NULL → requested
    db.add(
        TripStatusHistory(
            tenant_id=selected_tenant_id,
            trip_id=trip.trip_id,
            from_status=None,
            to_status="requested",
            changed_at_utc=now,
            changed_by=user.user_id,
        )
    )

    # ------------------------------------------------------------------
    # 5️⃣ Dispatch Rounds
    # ------------------------------------------------------------------
    for round_no, cfg in enumerate(DISPATCH_CONFIG, start=1):
        geo_key = f"drivers:geo:{selected_tenant_id}:{payload.city_id}"

        nearby_driver_ids = redis_client.georadius(
            geo_key,
            payload.pickup_longitude,
            payload.pickup_latitude,
            radius=cfg["radius_km"],
            unit="km",
            count=cfg["max_drivers"],
            sort="ASC",
        )

        if not nearby_driver_ids:
            continue

        nearby_driver_ids = [int(d) for d in nearby_driver_ids]

        # Create dispatch round
        dispatch_round = TripDispatchRound(
            tenant_id=selected_tenant_id,
            trip_id=trip.trip_id,
            search_radius_km=cfg["radius_km"],
            max_eta_seconds=cfg["timeout_sec"],
            round_no=round_no,
            started_at_utc=now,
            created_by=user.user_id,
        )
        db.add(dispatch_round)
        db.flush()

        # Status history: requested → dispatching (only first round)
        if round_no == 1:
            trip.trip_status = "dispatching"

            db.add(
                TripStatusHistory(
                    tenant_id=selected_tenant_id,
                    trip_id=trip.trip_id,
                    from_status="requested",
                    to_status="dispatching",
                    changed_at_utc=now,
                    changed_by=None,  # system
                )
            )

        

        # Create dispatch candidates
        candidates = []
        for driver_id in nearby_driver_ids:
            candidates.append(
                TripDispatchCandidate(
                    tenant_id=selected_tenant_id,
                    trip_id=trip.trip_id,
                    round_id=dispatch_round.round_id,
                    driver_id=driver_id,
                    request_sent_at_utc=now,
                    created_by=user.user_id,
                )
            )

        db.add_all(candidates)
        db.commit()

        # Notify first driver (async)
        first_driver_id = nearby_driver_ids[0]
        redis_client.publish(
            f"driver:trip_request:{first_driver_id}",
            str(trip.trip_id),
        )

        # Exit after first valid dispatch round
        break

    return {
        "trip_id": trip.trip_id,
        "tenant_id": selected_tenant_id,
        "status": "dispatching",
    }
