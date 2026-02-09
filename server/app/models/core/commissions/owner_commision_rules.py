from sqlalchemy import (
    BigInteger,
    Numeric,
    ForeignKey,
    Text,
    Boolean,
    TIMESTAMP,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.core.database import Base
from app.models.mixins import AuditMixin, TimestampMixin


class OwnerCommissionRule(Base, AuditMixin, TimestampMixin):
    __tablename__ = "owner_commission_rules"

    owner_commission_rule_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )

    country_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("countries.country_id"), nullable=False
    )

    city_id: Mapped[int] = mapped_column(
        BigInteger, nullable=False
    )

    vehicle_category: Mapped[str] = mapped_column(
        Text, ForeignKey("lu_vehicle_category.category_code"), nullable=False
    )

    owner_type: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_vehicle_owner_type.owner_type_code"),
        nullable=False,
    )

    # Distance slab
    min_distance_km: Mapped[float] = mapped_column(
        Numeric(6, 2), nullable=False, default=0
    )
    max_distance_km: Mapped[float | None] = mapped_column(
        Numeric(6, 2), nullable=True
    )

    owner_fee_type: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    owner_fee_value: Mapped[float] = mapped_column(
        Numeric(8, 2), nullable=False
    )
    owner_fee_cap: Mapped[float | None] = mapped_column(
        Numeric(8, 2), nullable=True
    )

    effective_from: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False
    )
    effective_to: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        CheckConstraint(
            "owner_fee_type IN ('flat', 'percentage')",
            name="chk_owner_fee_type",
        ),
        CheckConstraint(
            "max_distance_km IS NULL OR max_distance_km > min_distance_km",
            name="chk_owner_distance_range",
        ),
    )
