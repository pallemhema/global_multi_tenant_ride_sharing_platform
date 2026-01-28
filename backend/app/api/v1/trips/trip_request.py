# app/api/v1/trips/trip_request.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_rider
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

DISPATCH_ROUNDS = [
    {"radius_km": 3,  "max_drivers": 5,  "timeout_sec": 15},
    {"radius_km": 6,  "max_drivers": 8,  "timeout_sec": 20},
    {"radius_km": 10, "max_drivers": 12, "timeout_sec": 25},
]


# @router.post("/request")
# def request_trip(
#     payload: TripRequestCreate,
#     db: Session = Depends(get_db),
#     user: User = Depends(require_user),
# ):
#     now = datetime.now(timezone.utc)

#     # ------------------------------------------------------------------
#     # 1️⃣ Validate tenant service availability
#     # ------------------------------------------------------------------
#     tenant_ids = [
#         t.tenant_id
#         for t in db.query(TenantCity.tenant_id)
#         .filter(
#             TenantCity.city_id == payload.city_id,
#             TenantCity.is_active.is_(True),
#         )
#         .all()
#     ]

#     if not tenant_ids:
#         raise HTTPException(400, "Service not available in this city")

#     # ------------------------------------------------------------------
#     # 2️⃣ Select tenant with nearby AVAILABLE drivers
#     # ------------------------------------------------------------------
#     selected_tenant_id = None

#     for tenant_id in tenant_ids:
#         geo_key = f"drivers:geo:{tenant_id}:{payload.city_id}"

#         driver_ids = redis_client.georadius(
#             geo_key,
#             payload.pickup_longitude,
#             payload.pickup_latitude,
#             radius=3,
#             unit="km",
#             count=1,
#             sort="ASC",
#         )

#         if not driver_ids:
#             continue

#         # Decode & check availability
#         for d in driver_ids:
#             driver_id = int(d.decode() if isinstance(d, bytes) else d)
#             status = redis_client.get(f"driver:runtime:{driver_id}")
#             if status == b"available":
#                 selected_tenant_id = tenant_id
#                 break

#         if selected_tenant_id:
#             break

#     if not selected_tenant_id:
#         raise HTTPException(404, "No nearby drivers available")

#     # ------------------------------------------------------------------
#     # 3️⃣ Find or create Rider (tenant-scoped)
#     # ------------------------------------------------------------------
#     rider = (
#         db.query(Rider)
#         .filter(
#             Rider.tenant_id == selected_tenant_id,
#             Rider.user_id == user.user_id,
#         )
#         .first()
#     )

#     if not rider:
#         rider = Rider(
#             tenant_id=selected_tenant_id,
#             user_id=user.user_id,
#             default_city_id=payload.city_id,
#             is_active=True,
#             created_by=user.user_id,
#         )
#         db.add(rider)
#         db.flush()

#     if not rider.is_active:
#         raise HTTPException(403, "Rider blocked")

#     # ------------------------------------------------------------------
#     # 4️⃣ Create Trip (REQUESTED)
#     # ------------------------------------------------------------------
#     trip = Trip(
#         tenant_id=selected_tenant_id,
#         rider_id=rider.rider_id,
#         city_id=payload.city_id,
#         trip_status="requested",
#         pickup_latitude=payload.pickup_latitude,
#         pickup_longitude=payload.pickup_longitude,
#         drop_latitude=payload.drop_latitude,
#         drop_longitude=payload.drop_longitude,
#         requested_at_utc=now,
#         created_by=user.user_id,
#     )
#     db.add(trip)
#     db.flush()

#     db.add(
#         TripStatusHistory(
#             tenant_id=selected_tenant_id,
#             trip_id=trip.trip_id,
#             from_status=None,
#             to_status="requested",
#             changed_at_utc=now,
#             changed_by=user.user_id,
#         )
#     )

#     # ------------------------------------------------------------------
#     # 5️⃣ Dispatch Rounds (ONE successful round only)
#     # ------------------------------------------------------------------
#     for round_no, cfg in enumerate(DISPATCH_ROUNDS, start=1):
#         geo_key = f"drivers:geo:{selected_tenant_id}:{payload.city_id}"

#         raw_ids = redis_client.georadius(
#             geo_key,
#             payload.pickup_longitude,
#             payload.pickup_latitude,
#             radius=cfg["radius_km"],
#             unit="km",
#             count=cfg["max_drivers"],
#             sort="ASC",
#         )

#         if not raw_ids:
#             continue

#         driver_ids = []
#         for d in raw_ids:
#             driver_id = int(d.decode() if isinstance(d, bytes) else d)
#             if redis_client.get(f"driver:runtime:{driver_id}") == b"available":
#                 driver_ids.append(driver_id)

#         if not driver_ids:
#             continue

#         # Create dispatch round
#         dispatch_round = TripDispatchRound(
#             tenant_id=selected_tenant_id,
#             trip_id=trip.trip_id,
#             search_radius_km=cfg["radius_km"],
#             max_eta_seconds=cfg["timeout_sec"],
#             round_no=round_no,
#             started_at_utc=now,
#             created_by=user.user_id,
#         )
#         db.add(dispatch_round)
#         db.flush()

#         # Move trip to DISPATCHING (only once)
#         if round_no == 1:
#             trip.trip_status = "dispatching"
#             db.add(
#                 TripStatusHistory(
#                     tenant_id=selected_tenant_id,
#                     trip_id=trip.trip_id,
#                     from_status="requested",
#                     to_status="dispatching",
#                     changed_at_utc=now,
#                     changed_by=None,
#                 )
#             )

#         # Create dispatch candidates
#         db.add_all([
#             TripDispatchCandidate(
#                 tenant_id=selected_tenant_id,
#                 trip_id=trip.trip_id,
#                 round_id=dispatch_round.round_id,
#                 driver_id=driver_id,
#                 request_sent_at_utc=now,
#                 created_by=user.user_id,
#             )
#             for driver_id in driver_ids
#         ])

#         db.commit()

#         # Notify nearest driver
#         redis_client.publish(
#             f"driver:trip_request:{driver_ids[0]}",
#             str(trip.trip_id),
#         )

#         break

#     return {
#         "trip_id": trip.trip_id,
#         "tenant_id": selected_tenant_id,
#         "status": "dispatching",
#     }

def _get_active_tenants(db: Session, city_id: int) -> list[int]:
    rows = (
        db.query(TenantCity.tenant_id)
        .filter(
            TenantCity.city_id == city_id,
            TenantCity.is_active.is_(True),
        )
        .all()
    )
    return [r.tenant_id for r in rows]

def _select_tenant_with_drivers(
    tenant_ids: list[int],
    city_id: int,
    lat: float,
    lon: float,
) -> int | None:

    for tenant_id in tenant_ids:
        geo_key = f"drivers:geo:{tenant_id}:{city_id}"

        drivers = redis_client.georadius(
            geo_key,
            lon,
            lat,
            radius=3,
            unit="km",
            count=1,
            sort="ASC",
        )

        if drivers:
            return tenant_id

    return None

def _dispatch_trip(db: Session, trip: Trip, payload, now):
    for round_no, cfg in enumerate(DISPATCH_ROUNDS, start=1):
        geo_key = f"drivers:geo:{trip.tenant_id}:{trip.city_id}"

        driver_ids = redis_client.georadius(
            geo_key,
            payload.pickup_longitude,
            payload.pickup_latitude,
            radius=cfg["radius_km"],
            unit="km",
            count=cfg["max_drivers"],
            sort="ASC",
        )

        if not driver_ids:
            continue

        driver_ids = [int(d) for d in driver_ids]

        dispatch_round = TripDispatchRound(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            round_no=round_no,
            search_radius_km=cfg["radius_km"],
            max_eta_seconds=cfg["timeout_sec"],
            started_at_utc=now,
        )
        db.add(dispatch_round)
        db.flush()

        if round_no == 1:
            trip.trip_status = "dispatching"
            db.add(
                TripStatusHistory(
                    tenant_id=trip.tenant_id,
                    trip_id=trip.trip_id,
                    from_status="requested",
                    to_status="dispatching",
                    changed_at_utc=now,
                    changed_by=None,
                )
            )

        db.add_all(
            [
                TripDispatchCandidate(
                    tenant_id=trip.tenant_id,
                    trip_id=trip.trip_id,
                    round_id=dispatch_round.round_id,
                    driver_id=d,
                    request_sent_at_utc=now,
                )
                for d in driver_ids
            ]
        )

        redis_client.publish(
            f"driver:trip_request:{driver_ids[0]}",
            str(trip.trip_id),
        )

        break


@router.post("/request")
def request_trip(
    payload: TripRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_rider),
):
    now = datetime.now(timezone.utc)

    # 1. City availability
    tenant_ids = _get_active_tenants(db, payload.city_id)
    if not tenant_ids:
        raise HTTPException(400, "Service not available in this city")

    # 2. Tenant selection
    tenant_id = _select_tenant_with_drivers(
        tenant_ids,
        payload.city_id,
        payload.pickup_latitude,
        payload.pickup_longitude,
    )
    if not tenant_id:
        raise HTTPException(404, "No nearby drivers available")

    # 3. Rider (tenant scoped)
    rider = (
        db.query(Rider)
        .filter(
            Rider.tenant_id == tenant_id,
            Rider.user_id == user.user_id,
        )
        .first()
    )

    if not rider:
        rider = Rider(
            tenant_id=tenant_id,
            user_id=user.user_id,
            default_city_id=payload.city_id,
            is_active=True,
            created_by=user.user_id,
        )
        db.add(rider)
        db.flush()

    if not rider.is_active:
        raise HTTPException(403, "Rider blocked")

    # 4. Create trip
    trip = Trip(
        tenant_id=tenant_id,
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

    db.add(
        TripStatusHistory(
            tenant_id=tenant_id,
            trip_id=trip.trip_id,
            from_status=None,
            to_status="requested",
            changed_at_utc=now,
            changed_by=user.user_id,
        )
    )

    # 5. Dispatch
    _dispatch_trip(db, trip, payload, now)

    db.commit()

    return {
        "trip_id": trip.trip_id,
        "tenant_id": tenant_id,
        "status": "dispatching",
    }
