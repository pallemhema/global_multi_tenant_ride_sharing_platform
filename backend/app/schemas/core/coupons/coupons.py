from pydantic import BaseModel,ConfigDict
from datetime import datetime
from typing import Optional, List


class CouponCreate(BaseModel):
    coupon_code: str
    coupon_type: str            # flat / percentage
    discount_value: float
    max_discount: Optional[float] = None
    min_trip_fare: Optional[float] = None

    valid_from_utc: datetime
    valid_to_utc: datetime

    total_usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = None

    city_ids: List[int]
    vehicle_categories: List[str]
class CouponOut(BaseModel):
    coupon_id: int
    coupon_code: str
    coupon_type: str
    discount_value: float
    max_discount: Optional[float]
    min_trip_fare: Optional[float]
    valid_from_utc: datetime
    valid_to_utc: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class CouponRedemptionOut(BaseModel):
    coupon_id: int
    trip_id: int
    discount_amount: float
    redeemed_at_utc: datetime

    model_config = ConfigDict(from_attributes=True)