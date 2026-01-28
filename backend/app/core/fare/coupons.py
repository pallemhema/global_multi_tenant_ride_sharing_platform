from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.core.coupons.tenant_coupons import TenantCoupon
from app.models.core.coupons.tenant_coupon_availbility import TenantCouponApplicability
from app.models.core.coupons.coupon_redemptions import CouponRedemption
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.core.coupons import (
    TenantCoupon,
    TenantCouponApplicability,
    CouponRedemption,
)



def apply_coupon(
    *,
    db: Session,
    tenant_id: int,
    city_id: int,
    vehicle_category: str,
    rider_id: int,
    trip_id: int,
    coupon_code: str,
    fare_amount: Decimal,
):
    now = datetime.now(timezone.utc)

    coupon = (
        db.query(TenantCoupon)
        .filter(
            TenantCoupon.tenant_id == tenant_id,
            TenantCoupon.coupon_code == coupon_code,
            TenantCoupon.is_active.is_(True),
            TenantCoupon.valid_from_utc <= now,
            TenantCoupon.valid_to_utc >= now,
        )
        .first()
    )
    if not coupon:
        return Decimal("0.00"), None

    # City & vehicle applicability
    applicable = (
        db.query(TenantCouponApplicability)
        .filter(
            TenantCouponApplicability.coupon_id == coupon.coupon_id,
            TenantCouponApplicability.city_id == city_id,
            TenantCouponApplicability.vehicle_category == vehicle_category,
        )
        .first()
    )
    if not applicable:
        return Decimal("0.00"), None

    if coupon.min_trip_fare and fare_amount < coupon.min_trip_fare:
        return Decimal("0.00"), None

    # Usage checks
    total_used = (
        db.query(CouponRedemption)
        .filter(CouponRedemption.coupon_id == coupon.coupon_id)
        .count()
    )
    if coupon.total_usage_limit and total_used >= coupon.total_usage_limit:
        return Decimal("0.00"), None

    user_used = (
        db.query(CouponRedemption)
        .filter(
            CouponRedemption.coupon_id == coupon.coupon_id,
            CouponRedemption.rider_id == rider_id,
        )
        .count()
    )
    if coupon.per_user_limit and user_used >= coupon.per_user_limit:
        return Decimal("0.00"), None

    # Discount calculation
    if coupon.coupon_type == "flat":
        discount = min(coupon.discount_value, fare_amount)
    else:  # percentage
        discount = fare_amount * (coupon.discount_value / Decimal("100"))
        if coupon.max_discount:
            discount = min(discount, coupon.max_discount)

    # Persist redemption
    db.add(
        CouponRedemption(
            tenant_id=tenant_id,
            coupon_id=coupon.coupon_id,
            rider_id=rider_id,
            trip_id=trip_id,
            discount_amount=discount,
            redeemed_at_utc=now,
        )
    )

    return discount, coupon.coupon_id
