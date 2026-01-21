# app/core/fare/rules_loader.py

# app/core/fare/rules.py

from datetime import datetime
from sqlalchemy.orm import Session

from app.models.core.pricing.tenant_base_fare import TenantBaseFare
from app.models.core.pricing.tenant_distance_rate import TenantDistanceRate
from app.models.core.pricing.tenant_time_rate import TenantTimeRate
from app.models.core.pricing.tenant_minimum_fare import TenantMinimumFare
from app.models.core.pricing.surge_pricing_events import SurgePricingEvent
from app.models.core.pricing.tenant_tax_rules import TenantTaxRule
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session


def _now():
    return datetime.now(timezone.utc)


def load_base_fare(db: Session, tenant_id: int, city_id: int, vehicle_category: str) -> Decimal:
    row = (
        db.query(TenantBaseFare)
        .filter(
            TenantBaseFare.tenant_id == tenant_id,
            TenantBaseFare.city_id == city_id,
            TenantBaseFare.vehicle_category == vehicle_category,
            TenantBaseFare.effective_from <= _now(),
            (TenantBaseFare.effective_to.is_(None) | (TenantBaseFare.effective_to > _now())),
        )
        .order_by(TenantBaseFare.effective_from.desc())
        .first()
    )
    if not row:
        raise ValueError("Base fare not configured")
    return row.base_fare


def load_distance_rate(db: Session, tenant_id: int, city_id: int, vehicle_category: str) -> Decimal:
    row = (
        db.query(TenantDistanceRate)
        .filter(
            TenantDistanceRate.tenant_id == tenant_id,
            TenantDistanceRate.city_id == city_id,
            TenantDistanceRate.vehicle_category == vehicle_category,
            TenantDistanceRate.effective_from <= _now(),
            (TenantDistanceRate.effective_to.is_(None) | (TenantDistanceRate.effective_to > _now())),
        )
        .order_by(TenantDistanceRate.effective_from.desc())
        .first()
    )
    if not row:
        raise ValueError("Distance rate not configured")
    return row.rate_per_km


def load_time_rate(db: Session, tenant_id: int, city_id: int, vehicle_category: str) -> Decimal:
    row = (
        db.query(TenantTimeRate)
        .filter(
            TenantTimeRate.tenant_id == tenant_id,
            TenantTimeRate.city_id == city_id,
            TenantTimeRate.vehicle_category == vehicle_category,
            TenantTimeRate.effective_from <= _now(),
            (TenantTimeRate.effective_to.is_(None) | (TenantTimeRate.effective_to > _now())),
        )
        .order_by(TenantTimeRate.effective_from.desc())
        .first()
    )
    if not row:
        raise ValueError("Time rate not configured")
    return row.rate_per_minute


def load_minimum_fare(db: Session, tenant_id: int, city_id: int, vehicle_category: str) -> Decimal:
    row = (
        db.query(TenantMinimumFare)
        .filter(
            TenantMinimumFare.tenant_id == tenant_id,
            TenantMinimumFare.city_id == city_id,
            TenantMinimumFare.vehicle_category == vehicle_category,
            TenantMinimumFare.effective_from <= _now(),
            (TenantMinimumFare.effective_to.is_(None) | (TenantMinimumFare.effective_to > _now())),
        )
        .order_by(TenantMinimumFare.effective_from.desc())
        .first()
    )
    if not row:
        raise ValueError("Minimum fare not configured")
    return row.minimum_fare


def load_surge_multiplier(db: Session, tenant_id: int, city_id: int, vehicle_category: str) -> Decimal:
    row = (
        db.query(SurgePricingEvent)
        .filter(
            SurgePricingEvent.tenant_id == tenant_id,
            SurgePricingEvent.city_id == city_id,
            SurgePricingEvent.vehicle_category == vehicle_category,
            SurgePricingEvent.started_at_utc <= _now(),
            (SurgePricingEvent.ended_at_utc.is_(None) | (SurgePricingEvent.ended_at_utc > _now())),
        )
        .order_by(SurgePricingEvent.started_at_utc.desc())
        .first()
    )
    return row.surge_multiplier if row else Decimal("1.0")


def load_tax_percentage(db: Session, tenant_id: int, city_id: int) -> Decimal:
    row = (
        db.query(TenantTaxRule)
        .filter(
            TenantTaxRule.tenant_id == tenant_id,
            TenantTaxRule.city_id == city_id,
            TenantTaxRule.effective_from <= _now(),
            (TenantTaxRule.effective_to.is_(None) | (TenantTaxRule.effective_to > _now())),
        )
        .order_by(TenantTaxRule.effective_from.desc())
        .first()
    )
    return row.tax_percentage if row else Decimal("0.0")
