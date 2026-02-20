from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_Within
from geoalchemy2.elements import WKTElement
from shapely.geometry import Polygon
from datetime import datetime

from app.models.core.pricing.surge_zones import SurgeZone
from app.models.lookups.city import City
from app.models.core.tenants.tenant_cities import TenantCity
from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.schemas.core.pricing.surge import SurgeCreate,SurgeOut,SurgeZoneCreate,SurgeZoneOut

from app.models.core.pricing.surge_pricing_events import SurgePricingEvent
from sqlalchemy import or_,func
import json
from datetime import datetime, timezone

router = APIRouter(prefix="/surge-event", tags=["Tenant - Surge Management"])


@router.post("", response_model=SurgeOut)
def create_surge_event(
    payload: SurgeCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):

    now = datetime.now(timezone.utc)

    # Validate zone belongs to tenant
    zone = db.query(SurgeZone).filter(
        SurgeZone.zone_id == payload.zone_id,
        SurgeZone.tenant_id == admin["tenant_id"]
    ).first()

    if not zone:
        raise HTTPException(404, "Zone not found")

    # Prevent overlapping active surge for same vehicle + zone
    overlapping = db.query(SurgePricingEvent).filter(
        SurgePricingEvent.tenant_id == admin["tenant_id"],
        SurgePricingEvent.zone_id == payload.zone_id,
        SurgePricingEvent.vehicle_category == payload.vehicle_category,
        SurgePricingEvent.is_active.is_(True),
        or_(
            SurgePricingEvent.ended_at_utc.is_(None),
            SurgePricingEvent.ended_at_utc > now
        )
    ).first()

    if overlapping:
        raise HTTPException(400, "Active surge already exists")

    surge = SurgePricingEvent(
        tenant_id=admin["tenant_id"],
        country_id=payload.country_id,
        city_id=payload.city_id,
        zone_id=payload.zone_id,
        vehicle_category=payload.vehicle_category,
        surge_multiplier=payload.surge_multiplier,
        started_at_utc=payload.started_at_utc or now,
        ended_at_utc=payload.ended_at_utc,
        is_active=True,
       
        created_by=admin["sub"],
        updated_by=admin["sub"],
    )

    db.add(surge)
    db.commit()
    db.refresh(surge)

    return surge

@router.put("/{surge_id}/end")
def end_surge_event(
    surge_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):

    surge = db.query(SurgePricingEvent).filter(
        SurgePricingEvent.surge_id == surge_id,
        SurgePricingEvent.tenant_id == admin["tenant_id"]
    ).first()

    if not surge:
        raise HTTPException(404, "Surge not found")

    surge.is_active = False
    surge.ended_at_utc = datetime.utcnow()
    surge.updated_by = admin["sub"]

    db.commit()

    return {"message": "Surge ended"}

@router.put("/{surge_id}", response_model=SurgeOut)
def modify_surge_event(
    surge_id: int,
    payload: SurgeCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    existing = db.query(SurgePricingEvent).filter(
        SurgePricingEvent.surge_id == surge_id,
        SurgePricingEvent.tenant_id == admin["tenant_id"],
        SurgePricingEvent.is_active.is_(True),
    ).first()

    if not existing:
        raise HTTPException(404, "Active surge not found")

    #  End old surge
    existing.is_active = False
    existing.ended_at_utc = datetime.utcnow()

    #  Create new surge row
    new_surge = SurgePricingEvent(
        tenant_id=existing.tenant_id,
        country_id=existing.country_id,
        city_id=existing.city_id,
        zone_id=existing.zone_id,
        vehicle_category=payload.vehicle_category,
        surge_multiplier=payload.surge_multiplier,
        started_at_utc=datetime.utcnow(),
        is_active=True,
       
        created_by=admin["sub"],
        created_at_utc=datetime.utcnow(),
    )

    db.add(new_surge)
    db.commit()
    db.refresh(new_surge)

    return new_surge

@router.get("")
def get_active_surges(
    city_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    return db.query(SurgePricingEvent).filter(
        SurgePricingEvent.tenant_id == admin["tenant_id"],
        SurgePricingEvent.city_id == city_id,
        SurgePricingEvent.is_active.is_(True),
    ).order_by(SurgePricingEvent.started_at_utc.desc()).all()

@router.post("/zone", response_model=SurgeZoneOut)
def create_surge_zone(
    payload: SurgeZoneCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    # Validate tenant operates in city
    operating = db.query(TenantCity).filter(
        TenantCity.tenant_id == admin["tenant_id"],
        TenantCity.city_id == payload.city_id,
        TenantCity.is_active.is_(True),
    ).first()

    if not operating:
        raise HTTPException(400, "Tenant not operating in this city")

    city = db.get(City, payload.city_id)
    if not city:
        raise HTTPException(404, "City not found")

    if len(payload.coordinates) < 4:
        raise HTTPException(400, "Polygon must have at least 4 points")

    polygon = Polygon(payload.coordinates)
    if not polygon.is_valid:
        raise HTTPException(400, "Invalid polygon")

    wkt_polygon = WKTElement(polygon.wkt, srid=4326)

    inside_city = db.query(City).filter(
        City.city_id == payload.city_id,
        func.ST_Within(wkt_polygon, City.boundary)
    ).first()

    if not inside_city:
        raise HTTPException(400, "Zone must lie completely inside the city")

    zone = SurgeZone(
        tenant_id=admin["tenant_id"],
        city_id=payload.city_id,
        zone_name=payload.zone_name,
        zone_geometry=wkt_polygon,
        created_by=admin["sub"],
        created_at_utc=datetime.utcnow(),
        is_active=True,
    )

    db.add(zone)
    db.commit()
    db.refresh(zone)

    return zone


@router.put("/zone/{zone_id}", response_model=SurgeZoneOut)
def update_surge_zone(
    zone_id: int,
    payload: SurgeZoneCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    zone = db.query(SurgeZone).filter(
        SurgeZone.zone_id == zone_id,
        SurgeZone.tenant_id == admin["tenant_id"],
        SurgeZone.is_active.is_(True),
    ).first()

    if not zone:
        raise HTTPException(404, "Zone not found")

    polygon = Polygon(payload.coordinates)
    if not polygon.is_valid:
        raise HTTPException(400, "Invalid polygon")

    wkt_polygon = WKTElement(polygon.wkt, srid=4326)

    inside_city = db.query(City).filter(
        City.city_id == payload.city_id,
        func.ST_Within(wkt_polygon, City.boundary)
    ).first()

    if not inside_city:
        raise HTTPException(400, "Zone must lie inside city")

    zone.zone_name = payload.zone_name
    zone.zone_geometry = wkt_polygon
    zone.updated_by = admin["sub"]
    zone.updated_at_utc = datetime.utcnow()

    db.commit()
    db.refresh(zone)

    return zone

@router.get("/zone", response_model=list[SurgeZoneOut])
def get_zones(
    city_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    zones = (
        db.query(SurgeZone)
        .filter(
            SurgeZone.tenant_id == admin["tenant_id"],
            SurgeZone.city_id == city_id,
        )
        .order_by(SurgeZone.zone_id.desc())
        .all()
    )

    return zones


