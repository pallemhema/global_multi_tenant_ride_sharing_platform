from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger, Numeric, ForeignKey, TIMESTAMP, Text
from datetime import datetime
from decimal import Decimal
from app.core.database import Base
from ...mixins import TimestampMixin, AuditMixin

class TenantFareConfig(Base,TimestampMixin,AuditMixin):
    __tablename__ = "tenant_fare_config"

    fare_rule_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )

    country_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("countries.country_id"), nullable=False
    )

    city_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("cities.city_id"), nullable=False
    )

    vehicle_category: Mapped[str] = mapped_column(
        ForeignKey("lu_vehicle_category.category_code"), nullable=False
    )

    # ----------------------------
    # Core pricing
    # ----------------------------
    base_fare: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    rate_per_km: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    rate_per_minute: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # ----------------------------
    # Surge & tax
    # ----------------------------
    surge_multiplier: Mapped[Decimal] = mapped_column(Numeric(4, 2), default=1.0)
    tax_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)

    # ----------------------------
    # Validity
    # ----------------------------
    effective_from: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    effective_to: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))

   
