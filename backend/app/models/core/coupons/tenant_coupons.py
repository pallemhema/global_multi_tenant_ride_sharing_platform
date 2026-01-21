from sqlalchemy import (
     BigInteger, Text, Numeric, Boolean, Integer,
    TIMESTAMP, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

from ...mixins import AuditMixin,TimestampMixin

class TenantCoupon(Base,AuditMixin,TimestampMixin):
    __tablename__ = "tenant_coupons"

    coupon_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("tenants.tenant_id"))

    coupon_code: Mapped[str] = mapped_column(Text, nullable=False)
    coupon_type: Mapped[str] = mapped_column(
        ForeignKey("lu_coupon_type.coupon_type_code")
    )

    discount_value: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    max_discount: Mapped[float | None] = mapped_column(Numeric(8, 2))
    min_trip_fare: Mapped[float | None] = mapped_column(Numeric(8, 2))

    valid_from_utc: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    valid_to_utc: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False)

    total_usage_limit: Mapped[int | None]
    per_user_limit: Mapped[int | None]

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
