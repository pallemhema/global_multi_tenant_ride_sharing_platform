from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner_active
from app.schemas.core.drivers.driver_invites import DriverInviteCreate
from app.models.core.drivers.driver_invites import DriverInvite
from app.models.core.drivers.drivers import Driver
from app.schemas.core.drivers.driver_invites import DriverListOut
router = APIRouter(
    prefix="/fleet-owner",
    tags=["Fleet Owner – invites"],
)
@router.post("/drivers/invite")
def invite_driver(
    payload: DriverInviteCreate,
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner_active),
):
    # Prevent duplicate active invite
    existing = (
        db.query(DriverInvite)
        .filter(
            DriverInvite.tenant_id == fleet_owner.tenant_id,
            DriverInvite.fleet_owner_id == fleet_owner.fleet_owner_id,
            DriverInvite.driver_id == payload.driver_id,
            DriverInvite.invite_status == "send",
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "Invite already sent")

    invite = DriverInvite(
        tenant_id=fleet_owner.tenant_id,
        fleet_owner_id=fleet_owner.fleet_owner_id,
        driver_id=payload.driver_id,
        invite_status="sent",
        created_by=fleet_owner.user_id,
    )

    db.add(invite)
    db.commit()

    return {"status": "invite sent", "driver_id": payload.driver_id}



@router.get("/drivers", response_model=list[DriverListOut])
def list_drivers_for_fleet_owner(
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner_active),
):
    drivers = (
        db.query(Driver)
        .filter(
            Driver.tenant_id == fleet_owner.tenant_id,
            Driver.is_active.is_(True),
            Driver.kyc_status == "approved",
        )
        .all()
    )

    return drivers
