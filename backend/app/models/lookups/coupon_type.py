from sqlalchemy import Column, Text
from app.core.database import Base


class LuCouponType(Base):
    __tablename__ = "lu_coupon_type"

    coupon_type_code = Column(Text, primary_key=True)  # flat, percentage
    description = Column(Text, nullable=False)
