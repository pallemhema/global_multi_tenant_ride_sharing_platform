from sqlalchemy import Column, BigInteger, Text, ForeignKey
from app.core.database import Base
from sqlalchemy.orm import Mapped, mapped_column

class TenantCouponApplicability(Base):
    __tablename__ = "tenant_coupon_applicability"

    coupon_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenant_coupons.coupon_id"), primary_key=True
    )
    city_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("cities.city_id"), primary_key=True
    )
    vehicle_category: Mapped[str] = mapped_column(
        ForeignKey("lu_vehicle_category.category_code"), primary_key=True
    )
