from sqlalchemy import (
     BigInteger, Numeric, TIMESTAMP, ForeignKey
)
from app.core.database import Base

from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column

class CouponRedemption(Base):
    __tablename__ = "coupon_redemptions"

    redemption_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    tenant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("tenants.tenant_id"))
    coupon_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenant_coupons.coupon_id")
    )
    rider_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("riders.rider_id"))
    trip_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("trips.trip_id"))

    discount_amount: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    redeemed_at_utc: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False
    )

    created_at_utc: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    created_by:Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.user_id"))
