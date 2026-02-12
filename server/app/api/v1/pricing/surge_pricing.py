
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.core.pricing.surge_pricing_events import SurgePricingEvent
from app.core.security.roles import require_tenant_admin
from app.core.dependencies import get_db
from app.

router = APIRouter(prefix="/tenant-admin", tags=['Tenant - Surge Pricing'])
@router.post("/surge")
def create_surge_event(
    payload: SurgeCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_tenant_admin),
):
    now = datetime.now(timezone.utc)

    surge = SurgePricingEvent(
        tenant_id=admin.tenant_id,
        country_id=payload.country_id,
        city_id=payload.city_id,
        vehicle_category=payload.vehicle_category,
        surge_multiplier=payload.surge_multiplier,
        started_at_utc=payload.started_at_utc,
        ended_at_utc=payload.ended_at_utc,
        reason=payload.reason,
        created_at=now,
        created_by=admin.user_id,
    )

    db.add(surge)
    db.commit()

    return {"message": "Surge event created"}
