from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.models.core.accounting.ledger import FinancialLedger

router = APIRouter(
    tags=["Fleet Owner – Dashboard"],
)

@router.get("/dashboard")
def fleet_dashboard(
    tenant_id: int,
    db: Session = Depends(get_db),
    fleet = Depends(require_fleet_owner),
):
    total_vehicles = db.query(Vehicle).filter(
        Vehicle.fleet_owner_id == fleet.fleet_owner_id
    ).count()

    active_drivers = db.query(DriverCurrentStatus).filter(
        DriverCurrentStatus.runtime_status == "available"
    ).count()

    revenue = db.query(func.sum(FinancialLedger.amount)).filter(
        FinancialLedger.entity_type == "fleet_owner",
        FinancialLedger.entity_id == fleet.fleet_owner_id
    ).scalar() or 0

    return {
        "total_vehicles": total_vehicles,
        "active_drivers": active_drivers,
        "total_revenue": revenue,
    }
