# app/api/v1/public/tenants.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.core.tenants.tenants import Tenant

router = APIRouter(
    prefix="/public/tenants",
    tags=["Public – Tenants"],
)

@router.get("/active")
def list_active_tenants(db: Session = Depends(get_db)):
    tenants = (
        db.query(Tenant)
        .filter(
            Tenant.status == "active",
            Tenant.approval_status == "approved",
        )
        .all()
    )

    return [
        {
            "tenant_id": t.tenant_id,
            "tenant_name": t.tenant_name,
            "legal_name": t.legal_name,
        }
        for t in tenants
    ]
