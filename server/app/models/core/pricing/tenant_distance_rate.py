
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger, Numeric, ForeignKey, TIMESTAMP, Boolean, Text
)
from app.core.database import Base
class TenantDistanceRate(Base):
    __tablename__ = "tenant_distance_rate"

    distance_rate_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    tenant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("tenants.tenant_id"))
    city_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("cities.city_id"))
    country_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("countries.country_id"))

    vehicle_category: Mapped[str] = mapped_column(
        ForeignKey("lu_vehicle_category.category_code")
    )

    rate_per_km: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)

    effective_from: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    effective_to: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True))

    created_at_utc: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True))
    created_by: Mapped[int | None] = mapped_column(BigInteger)
