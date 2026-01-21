from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger, Numeric, ForeignKey, TIMESTAMP, Boolean, Text
)
from app.core.database import Base

class SurgePricingEvent(Base):
    __tablename__ = "surge_pricing_events"

    surge_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    tenant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("tenants.tenant_id"))
    city_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("cities.city_id"))
    vehicle_category: Mapped[str] = mapped_column(
        ForeignKey("lu_vehicle_category.category_code")
    )

    surge_multiplier: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)

    started_at_utc: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    ended_at_utc: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True))

    reason: Mapped[str | None] = mapped_column(Text)
