from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger, Numeric, ForeignKey, TIMESTAMP, Boolean, Text
)
from app.core.database import Base

class TenantBaseFare(Base):
    __tablename__ = "tenant_base_fare"

    base_fare_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )
    city_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("cities.city_id"), nullable=False
    )
    country_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("countries.country_id"), nullable=False
    )
    vehicle_category: Mapped[str] = mapped_column(
        ForeignKey("lu_vehicle_category.category_code"), nullable=False
    )

    base_fare: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)

    effective_from: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    effective_to: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True))

    created_at_utc: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True))
    created_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id")
    )
