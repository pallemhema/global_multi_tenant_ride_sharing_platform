from sqlalchemy.orm import Session
from sqlalchemy import or_,func
from datetime import datetime, timezone
from geoalchemy2.functions import ST_Contains
from geoalchemy2.elements import WKTElement


from app.models.core.pricing.surge_pricing_events import SurgePricingEvent
from app.models.core.pricing.surge_zones import SurgeZone

class SurgeService:

    @staticmethod
    def get_active_zone_surge(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
        pickup_lat: float,
        pickup_lng: float,
    ) -> float | None:

        now = datetime.now(timezone.utc)

        # Create point geometry
        pickup_point = WKTElement(
            f"POINT({pickup_lng} {pickup_lat})",
            srid=4326
        )
        now = datetime.now(timezone.utc)
         # 1️⃣ Find matching zone
        zone = (
            db.query(SurgeZone)
            .filter(
                SurgeZone.tenant_id == tenant_id,
                SurgeZone.city_id == city_id,
                func.ST_Contains(
                    SurgeZone.zone_geometry,
                    func.ST_SetSRID(func.ST_Point(pickup_lng, pickup_lat), 4326)
                )
            )
            .first()
        )

            
            

        if not zone:
            return None

        # 2️⃣ Find active surge for zone + vehicle
        surge = (
            db.query(SurgePricingEvent)
            .filter(
                SurgePricingEvent.tenant_id == tenant_id,
                SurgePricingEvent.city_id == city_id,
                SurgePricingEvent.vehicle_category == vehicle_category,
                SurgePricingEvent.zone_id == zone.zone_id,
                SurgePricingEvent.is_active.is_(True),
                SurgePricingEvent.started_at_utc <= now,
                or_(
                    SurgePricingEvent.ended_at_utc.is_(None),
                    SurgePricingEvent.ended_at_utc > now
                )
            )
            .first()
        )

        if not surge:
            return None

        return float(surge.surge_multiplier)
