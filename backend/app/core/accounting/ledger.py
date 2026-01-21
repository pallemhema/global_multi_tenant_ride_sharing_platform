from decimal import Decimal
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.core.accounting.ledger import FinancialLedger
from app.models.core.trips.trips import Trip
from app.models.core.vehicles.vehicles import Vehicle


PLATFORM_ENTITY = "platform"
TENANT_ENTITY = "tenant"
DRIVER_ENTITY = "driver"
FLEET_OWNER_ENTITY = "fleet_owner"


def post_trip_ledger(
    *,
    db: Session,
    trip: Trip,
    final_fare: Decimal,
    platform_fee_pct: Decimal,
    tax_amount: Decimal,
    currency_code: str,
):
    """
    Creates immutable ledger entries for a completed trip.
    """

    now = datetime.now(timezone.utc)

    # Load vehicle to determine who gets paid
    vehicle: Vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == trip.vehicle_id
    ).one()

    platform_fee = (final_fare * platform_fee_pct) / Decimal("100")
    earnings_pool = final_fare - platform_fee - tax_amount

    # 1️⃣ Rider → Platform (trip fare)
    db.add(
        FinancialLedger(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            entity_type=PLATFORM_ENTITY,
            entity_id=None,
            transaction_type="trip_fare",
            amount=final_fare,
            currency_code=currency_code,
            created_at_utc=now,
        )
    )

    # 2️⃣ Platform → Tax authority (liability)
    if tax_amount > 0:
        db.add(
            FinancialLedger(
                tenant_id=trip.tenant_id,
                trip_id=trip.trip_id,
                entity_type=PLATFORM_ENTITY,
                entity_id=None,
                transaction_type="tax",
                amount=-tax_amount,
                currency_code=currency_code,
                created_at_utc=now,
            )
        )

    # 3️⃣ Platform keeps commission
    db.add(
        FinancialLedger(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            entity_type=PLATFORM_ENTITY,
            entity_id=None,
            transaction_type="platform_fee",
            amount=platform_fee,
            currency_code=currency_code,
            created_at_utc=now,
        )
    )

    # 4️⃣ Earnings follow the vehicle
    if vehicle.owner_type == "driver":
        entity_type = DRIVER_ENTITY
        entity_id = vehicle.driver_owner_id
    else:
        entity_type = FLEET_OWNER_ENTITY
        entity_id = vehicle.fleet_owner_id

    db.add(
        FinancialLedger(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            entity_type=entity_type,
            entity_id=entity_id,
            transaction_type="driver_earning",
            amount=earnings_pool,
            currency_code=currency_code,
            created_at_utc=now,
        )
    )

    db.flush()
