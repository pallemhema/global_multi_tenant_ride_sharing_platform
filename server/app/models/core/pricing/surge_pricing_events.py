from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger,
    Numeric,
    ForeignKey,
    TIMESTAMP,
    Boolean,
    Text,
    CheckConstraint,
)
from datetime import datetime
from app.core.database import Base
from ...mixins import TimestampMixin, AuditMixin
class SurgePricingEvent(Base,TimestampMixin,AuditMixin):
    __tablename__ = "surge_pricing_events"

    surge_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=False,
    )

    country_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("countries.country_id"),
        nullable=False,
    )

    city_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cities.city_id"),
        nullable=False,
    )

    vehicle_category: Mapped[str] = mapped_column(
        ForeignKey("lu_vehicle_category.category_code"),
        nullable=False,
    )

    surge_multiplier: Mapped[float] = mapped_column(
        Numeric(4, 2),
        nullable=False,
    )

    started_at_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
    )

    ended_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    zone_id : Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey('surge_zones.zone_id'),
        nullable=True

    )

    
    __table_args__ = (
        CheckConstraint(
            "surge_multiplier >= 1.00",
            name="chk_surge_min_value",
        ),
    )
