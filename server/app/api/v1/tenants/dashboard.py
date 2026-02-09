from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.models.core.tenants.tenant_documents import TenantDocument
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.core.drivers.drivers import Driver

router = APIRouter(
    tags=["Tenant Admin – Dashboard"],
)


@router.get("/{tenant_id}/dashboard")
def tenant_dashboard(
    tenant_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    # enforce tenant boundary: tenant admin token must belong to this tenant
    if user.get("tenant_id") != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied for this tenant")

    # Pending tenant documents
    pending_documents = (
        db.query(TenantDocument)
        .filter(
            TenantDocument.tenant_id == tenant_id,
            TenantDocument.verification_status == "pending",
        )
        .count()
    )

    # Pending vehicles: consider vehicles not yet active
    pending_vehicles = (
        db.query(Vehicle)
        .filter(
            Vehicle.tenant_id == tenant_id,
            Vehicle.status != "active",
        )
        .count()
    )

    # Pending fleet owners (approval_status == pending)
    pending_fleet_owners = (
        db.query(FleetOwner)
        .filter(
            FleetOwner.tenant_id == tenant_id,
            FleetOwner.approval_status == "pending",
        )
        .count()
    )

    # Pending drivers (kyc_status == pending)
    pending_drivers = (
        db.query(Driver)
        .filter(
            Driver.tenant_id == tenant_id,
            Driver.kyc_status == "pending",
        )
        .count()
    )

    return {
        "pendingDocuments": pending_documents,
        "pendingVehicles": pending_vehicles,
        "pendingFleetOwners": pending_fleet_owners,
        "pendingDrivers": pending_drivers,
    }
