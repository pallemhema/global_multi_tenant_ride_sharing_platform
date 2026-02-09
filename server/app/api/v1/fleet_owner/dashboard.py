from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_db
from app.core.security.roles import get_or_create_fleet_owner
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.models.core.accounting.ledger import FinancialLedger
from app.models.core.fleet_owners.fleet_owner_drivers import FleetOwnerDriver
from app.models.core.fleet_owners.driver_invites import DriverInvite
from app.models.core.trips.trips import Trip

router = APIRouter(
    tags=["Fleet Owner – Dashboard"],
)


@router.get("/dashboard/stats")
def fleet_dashboard(
    db: Session = Depends(get_db),
    fleet: Any = Depends(get_or_create_fleet_owner),
):
    tenant_id = fleet.tenant_id
    total_vehicles = db.query(Vehicle).filter(
        Vehicle.fleet_owner_id == fleet.fleet_owner_id
    ).count()

    # Count only drivers for this tenant who are currently available
    drivers = db.query(FleetOwnerDriver).filter(
        FleetOwnerDriver.fleet_owner_id == fleet.fleet_owner_id
    ).all()

    driver_ids = [d.driver_id for d in drivers]
    total_drivers = len(driver_ids)
    
    active_drivers = db.query(DriverCurrentStatus).filter(
        DriverCurrentStatus.runtime_status.in_(["available", "on_trip",'trip_accepted']),
        getattr(DriverCurrentStatus, "tenant_id", None) == tenant_id,
        DriverCurrentStatus.driver_id.in_(driver_ids)
    ).count()

    invites_count = db.query(DriverInvite).filter(
        DriverInvite.fleet_owner_id == fleet.fleet_owner_id,
        DriverInvite.invite_status == "sent"
    ).count()

    trips_completed = (
        db.query(Trip)
        .filter(Trip.driver_id.in_(driver_ids),
                getattr(Trip, "tenant_id", None) == tenant_id,
                Trip.trip_status == "completed")
        .count()
    )



    return {
        "total_vehicles": total_vehicles,
        "active_drivers": active_drivers,
        "total_drivers": total_drivers,
        "pending_invites": invites_count,
        "trips_completed": trips_completed,
    }
