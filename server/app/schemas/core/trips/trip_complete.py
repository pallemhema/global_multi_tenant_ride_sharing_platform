from pydantic import BaseModel
class TripCompleteRequest(BaseModel):
    distance_km: float
    duration_minutes: int
    coupon_code: str | None = None


class FareBreakdown(BaseModel):
    base_fare: float
    distance_charge: float
    time_charge: float
    subtotal: float
    tax_amount: float
    coupon_discount: float = 0.0
    total_fare: float
    currency: str


class TripCompleteResponse(BaseModel):
    status: str
    trip_id: int
    fare: FareBreakdown
    message: str