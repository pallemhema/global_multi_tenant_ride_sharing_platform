"""
Payout and Settlement API endpoints.

Endpoints:
- POST /tenant-admin/payouts/create-batch: Create payout batch for period
- POST /tenant-admin/payouts/{batch_id}/process: Process all payouts in batch
- GET /tenant-admin/payouts/{batch_id}: Get batch details with items
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from decimal import Decimal

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.core.payouts.payout_service import PayoutService
from app.models.core.payouts.payout_batch import PayoutBatch, PayoutItem


router = APIRouter(
    prefix="/tenant-admin/payouts",
    tags=["payouts"],
)


class PayoutBatchCreateRequest:
    """Request to create payout batch"""
    period_start_date: datetime
    period_end_date: datetime
    currency_code: str = "USD"


class PayoutBatchResponse:
    """Response with payout batch details"""
    payout_batch_id: int
    tenant_id: int
    period_start: str
    period_end: str
    currency_code: str
    total_amount: float
    items_count: int
    batch_status: str


class PayoutItemResponse:
    """Response for single payout item"""
    payout_item_id: int
    entity_type: str
    entity_id: int
    payout_amount: float
    currency_code: str
    item_status: str
    paid_at_utc: str | None


@router.post("/create-batch")
def create_payout_batch(
    period_start_date: datetime = Query(...),
    period_end_date: datetime = Query(...),
    currency_code: str = Query("USD"),
    tenant_admin: dict = Depends(require_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Create payout batch for a tenant for a settlement period.
    
    Only tenant admin can create batches for their tenant.
    
    - **period_start_date**: Start of settlement period
    - **period_end_date**: End of settlement period  
    - **currency_code**: Settlement currency (default: USD)
    """
    
    # Extract tenant_id from jwt token context
    tenant_id = tenant_admin.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID not found in token")
    
    # Ensure dates are UTC
    if period_start_date.tzinfo is None:
        period_start_date = period_start_date.replace(tzinfo=timezone.utc)
    if period_end_date.tzinfo is None:
        period_end_date = period_end_date.replace(tzinfo=timezone.utc)
    
    if period_start_date >= period_end_date:
        raise HTTPException(status_code=400, detail="period_start must be before period_end")
    
    try:
        result = PayoutService.create_payout_batch(
            db=db,
            tenant_id=tenant_id,
            period_start=period_start_date,
            period_end=period_end_date,
            currency_code=currency_code,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{payout_batch_id}/process")
def process_payout_batch(
    payout_batch_id: int,
    tenant_admin: dict = Depends(require_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Process all pending payouts in a batch.
    
    Marks items as paid, updates wallet balances, creates ledger entries.
    Only tenant admin can process batches for their tenant.
    
    - **payout_batch_id**: Batch ID to process
    """
    
    tenant_id = tenant_admin.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID not found in token")
    
    # Verify batch belongs to tenant
    batch = db.query(PayoutBatch).filter(
        PayoutBatch.payout_batch_id == payout_batch_id,
        PayoutBatch.tenant_id == tenant_id,
    ).first()
    
    if not batch:
        raise HTTPException(
            status_code=404,
            detail=f"Payout batch {payout_batch_id} not found or does not belong to your tenant"
        )
    
    try:
        result = PayoutService.process_batch(
            db=db,
            payout_batch_id=payout_batch_id,
            confirmed_by_user_id=tenant_admin.get("sub"),
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{payout_batch_id}")
def get_payout_batch(
    payout_batch_id: int,
    tenant_admin: dict = Depends(require_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Get payout batch details with all items and statuses.
    
    Only tenant admin can view batches for their tenant.
    """
    
    tenant_id = tenant_admin.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID not found in token")
    
    # Fetch batch
    batch = db.query(PayoutBatch).filter(
        PayoutBatch.payout_batch_id == payout_batch_id,
        PayoutBatch.tenant_id == tenant_id,
    ).first()
    
    if not batch:
        raise HTTPException(
            status_code=404,
            detail=f"Payout batch {payout_batch_id} not found"
        )
    
    # Fetch items
    items = db.query(PayoutItem).filter(
        PayoutItem.payout_batch_id == payout_batch_id
    ).all()
    
    return {
        "payout_batch_id": batch.payout_batch_id,
        "tenant_id": batch.tenant_id,
        "period_start_date": batch.period_start_date.isoformat() if batch.period_start_date else None,
        "period_end_date": batch.period_end_date.isoformat() if batch.period_end_date else None,
        "currency_code": batch.currency_code,
        "batch_status": batch.batch_status,
        "total_amount": float(batch.total_amount) if batch.total_amount else 0,
        "items_count": batch.items_count,
        "items_completed": batch.items_completed,
        "processed_at_utc": batch.processed_at_utc.isoformat() if batch.processed_at_utc else None,
        "items": [
            {
                "payout_item_id": item.payout_item_id,
                "entity_type": item.entity_type,
                "entity_id": item.entity_id,
                "owner_type": item.owner_type,
                "payout_amount": float(item.payout_amount),
                "currency_code": item.currency_code,
                "item_status": item.item_status,
                "paid_at_utc": item.paid_at_utc.isoformat() if item.paid_at_utc else None,
            }
            for item in items
        ],
    }
