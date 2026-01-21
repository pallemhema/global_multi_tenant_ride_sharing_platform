from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.core.drivers.driver_invites import DriverInvite
from app.core.security.roles import require_driver
from datetime import datetime
from app.schemas.core.drivers.driver_invites import DriverInviteAction
ACTION_TO_STATUS = {
    "accept": "accepted",
    "reject": "rejected",
    "cancel": "cancelled",
}

router = APIRouter(
    prefix="/driver",
    tags=["Driver – invite status"],
)
@router.post("/invites/{invite_id}/action")
def handle_invite_action(
    invite_id: int,
    payload: DriverInviteAction,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    invite = (
        db.query(DriverInvite)
        .filter(
            DriverInvite.invite_id == invite_id,
            DriverInvite.driver_id == driver.driver_id,
        )
        .first()
    )

    if not invite:
        raise HTTPException(404, "Invite not found")

    # 🚨 Only SENT invites can be acted upon
    if invite.invite_status != "sent":
        raise HTTPException(
            400,
            f"Invite already {invite.invite_status}, action not allowed",
        )

    invite.invite_status = ACTION_TO_STATUS[payload.action]
    invite.updated_by = driver.user_id
    invite.updated_at_utc = datetime.utcnow()

    db.commit()

    return {
        "invite_id": invite.invite_id,
        "status": invite.invite_status,
    }
