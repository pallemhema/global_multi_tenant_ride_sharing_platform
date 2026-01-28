
# 1. Base fare
# 2. Distance fare
# 3. Time fare
# ----------------
# 4. Subtotal
# 5. Apply surge
# ----------------
# 6. Enforce minimum fare
# ----------------
# 7. Apply coupon
# ----------------
# 8. Apply tax
# ----------------
# 9. Final fare

from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.fare.coupons import apply_coupon
from app.core.fare.rules_loader import (
    load_base_fare,
    load_distance_rate,
    load_time_rate,
    load_minimum_fare,
    load_surge_multiplier,
    load_tax_percentage,
)


def calculate_fare(
    *,
    db: Session,
    tenant_id: int,
    city_id: int,
    vehicle_category: str,
    distance_km: Decimal,
    duration_minutes: Decimal,
    rider_id: int,
    trip_id: int,
    coupon_code: str | None = None,
) -> dict:
    """
    Returns complete fare breakdown.
    """

    # 1️⃣ Load pricing components
    base_fare = load_base_fare(db, tenant_id, city_id, vehicle_category)
    distance_rate = load_distance_rate(db, tenant_id, city_id, vehicle_category)
    time_rate = load_time_rate(db, tenant_id, city_id, vehicle_category)
    min_fare = load_minimum_fare(db, tenant_id, city_id, vehicle_category)
    surge = load_surge_multiplier(db, tenant_id, city_id, vehicle_category)
    tax_pct = load_tax_percentage(db, tenant_id, city_id)

    # 2️⃣ Core fare
    distance_fare = distance_km * distance_rate
    time_fare = duration_minutes * time_rate

    subtotal = base_fare + distance_fare + time_fare
    surged_fare = subtotal * surge

    # 3️⃣ Enforce minimum fare
    fare_before_discount = max(surged_fare, min_fare)

    # 4️⃣ Apply coupon
    discount = Decimal("0.00")
    coupon_id = None

    if coupon_code:
        discount, coupon_id = apply_coupon(
            db=db,
            tenant_id=tenant_id,
            city_id=city_id,
            vehicle_category=vehicle_category,
            rider_id=rider_id,
            trip_id=trip_id,
            coupon_code=coupon_code,
            fare_amount=fare_before_discount,
        )

    discounted_fare = fare_before_discount - discount

    # 5️⃣ Tax
    tax_amount = (discounted_fare * tax_pct) / Decimal("100")

    final_fare = discounted_fare + tax_amount

    TWOPLACES = Decimal("0.01")

    tax_amount = tax_amount.quantize(TWOPLACES)
    final_fare = final_fare.quantize(TWOPLACES)


    return {
        "base_fare": base_fare,
        "distance_fare": distance_fare,
        "time_fare": time_fare,
        "surge_multiplier": surge,
        "subtotal": subtotal,
        "fare_before_discount": fare_before_discount,
        "discount": discount,
        "tax_amount": tax_amount,
        "final_fare": final_fare,
        "coupon_id": coupon_id,
    }
