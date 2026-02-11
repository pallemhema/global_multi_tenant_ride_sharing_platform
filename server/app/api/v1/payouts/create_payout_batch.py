from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.core.dependencies import get_db
from app.models.core.payouts.payout_batch import PayoutBatch
from app.models.core.payouts.payouts import Payout
from app.models.core.tenants.tenant_countries import TenantCountry
from app.models.lookups.country import Country
from app.schemas.core.payouts.payout_batch import (
    PayoutBatchCreateRequest,
    PayoutBatchResponse,
)
from app.core.security.roles import require_app_admin
from app.models.core.payments.payments import Payment   
from app.models.core.accounting.ledger import FinancialLedger

router = APIRouter(prefix="/payout-batches", tags=["Payouts"])

from datetime import datetime, timedelta, timezone

def get_last_week_range():
    now = datetime.now(timezone.utc)

    # Move to last Monday
    start = now - timedelta(days=now.weekday() + 7)
    start = start.replace(hour=0, minute=0, second=0, microsecond=0)

    end = start + timedelta(days=6)
    end = end.replace(hour=23, minute=59, second=59, microsecond=999999)

    return start, end

@router.post("", response_model=PayoutBatchResponse)
def create_payout_batch(
    payload: PayoutBatchCreateRequest,
    db: Session = Depends(get_db),
    app: dict = Depends(require_app_admin),
):
 
    tenant_country = (
        db.query(TenantCountry)
        .filter(
            TenantCountry.tenant_id == payload.tenant_id,
            TenantCountry.country_id == payload.country_id,
            TenantCountry.is_active == True,
        )
        .first()
    )

    if not tenant_country:
        raise HTTPException(
            status_code=400,
            detail="Tenant is not active in this country",
        )

    
    country = (
        db.query(Country)
        .filter(Country.country_id == payload.country_id)
        .first()
    )

    if not country:
        raise HTTPException(
            status_code=400,
            detail="Country not found",
        )

    currency_code = country.default_currency

    period_start, period_end = get_last_week_range()

    overlapping_batch = (
        db.query(PayoutBatch)
        .filter(
            PayoutBatch.tenant_id == payload.tenant_id,
            PayoutBatch.country_id == payload.country_id,
            and_(
                PayoutBatch.period_start_utc <= period_start,
                PayoutBatch.period_end_utc >= period_end,
            ),
        )
        .first()
    )

    if overlapping_batch:
        raise HTTPException(
            status_code=409,
            detail="Overlapping payout batch already exists",
        )


    payout_batch = PayoutBatch(
        tenant_id=payload.tenant_id,
        country_id=payload.country_id,
        currency_code=currency_code,
        period_start_utc=period_start,
        period_end_utc=period_end,
        status="initiated",
    )

    db.add(payout_batch)
    db.commit()
    db.refresh(payout_batch)

    return PayoutBatchResponse(
        payout_batch_id=payout_batch.payout_batch_id,
        tenant_id=payout_batch.tenant_id,
        country_id=payout_batch.country_id,
        currency_code=payout_batch.currency_code,
        status=payout_batch.status,
    )

@router.get("")
def list_payout_batches(db: Session = Depends(get_db)):
    rows = (
        db.query(
            PayoutBatch.payout_batch_id,
            PayoutBatch.tenant_id,
            PayoutBatch.country_id,
            PayoutBatch.currency_code,
            PayoutBatch.period_start_utc,
            PayoutBatch.period_end_utc,
            PayoutBatch.status,
            PayoutBatch.created_at_utc,
            func.count(Payout.payout_id).label("total_payouts"),
            func.coalesce(func.sum(Payout.paid_amount), 0).label("total_amount"),
        )
        .outerjoin(Payout, Payout.payout_batch_id == PayoutBatch.payout_batch_id)
        .group_by(PayoutBatch.payout_batch_id)
        .order_by(PayoutBatch.created_at_utc.desc())
        .all()
    )

    return [
        {
            "batch_id": r.payout_batch_id,
            "tenant_id": r.tenant_id,
            "country_id": r.country_id,
            "currency_code": r.currency_code,
            "period_start_utc": r.period_start_utc,
            "period_end_utc": r.period_end_utc,
            "status": r.status,
            "total_payouts": r.total_payouts,
            "total_amount": float(r.total_amount),
            "created_at_utc": r.created_at_utc,
        }
        for r in rows
    ]

@router.get("/{batch_id}")
def get_payout_batch_detail(
    batch_id: int,
    db: Session = Depends(get_db),
):
    batch = (
        db.query(PayoutBatch)
        .filter(PayoutBatch.payout_batch_id == batch_id)
        .first()
    )

    if not batch:
        return {"detail": "Batch not found"}

    payouts = (
        db.query(Payout)
        .filter(Payout.payout_batch_id == batch_id)
        .order_by(Payout.payout_id)
        .all()
    )

    return {
        "batch": {
            "batch_id": batch.payout_batch_id,
            "tenant_id": batch.tenant_id,
            "country_id": batch.country_id,
            "currency_code": batch.currency_code,
            "period_start_utc": batch.period_start_utc,
            "period_end_utc": batch.period_end_utc,
            "status": batch.status,
            "created_at_utc": batch.created_at_utc,
            "processed_at_utc": batch.processed_at_utc,
        },
        "payouts": [
            {
                "payout_id": p.payout_id,
                "entity_type": p.entity_type,
                "owner_type": p.owner_type,
                "entity_id": p.entity_id,
                "gross_amount": float(p.gross_amount),
                "net_amount": float(p.net_amount),
                "paid_amount": float(p.paid_amount),
                "status": p.status,
            }
            for p in payouts
        ],
    }


@router.get("/{batch_id}/payments")

def list_batch_payments(
    batch_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_app_admin),
):
    batch = db.get(PayoutBatch, batch_id)
    if not batch:
        raise HTTPException(404, "Batch not found")

    payments = (
        db.query(Payment)
        .filter(
            Payment.tenant_id == batch.tenant_id,
            Payment.paid_at_utc >= batch.period_start_utc,
            Payment.paid_at_utc <= batch.period_end_utc,
            Payment.payment_status == "successful",
        )
        .order_by(Payment.paid_at_utc.desc())
        .all()
    )

    results = []

    for p in payments:

        ledger_rows = (
            db.query(
                FinancialLedger.transaction_type,
                func.sum(FinancialLedger.amount).label("total"),
            )
            .filter(
                FinancialLedger.payment_id == p.payment_id,
                FinancialLedger.entry_type == "CREDIT",
            )
            .group_by(FinancialLedger.transaction_type)
            .all()
        )

        # Default values
        splits = {
            "platform_fee": 0.0,
            "tax": 0.0,
            "driver_earning": 0.0,
            "tenant_share": 0.0,
        }

        for row in ledger_rows:
            splits[row.transaction_type] = float(row.total or 0)

        results.append({
            "payment_id": p.payment_id,
            "trip_id": p.trip_id,
            "total_fare": float(p.amount),
            "platform_fee": splits["platform_fee"],
            "tax": splits["tax"],
            "driver_earning": splits["driver_earning"],
            "tenant_share": splits["tenant_share"],
            "currency_code": p.currency_code,
            "paid_at_utc": p.paid_at_utc,
        })

    return results

@router.get("/{batch_id}/payouts")
def list_batch_payout(
    batch_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_app_admin),
):
    payouts = (
        db.query(Payout)
        .filter(Payout.payout_batch_id == batch_id)
        .order_by(Payout.payout_id)
        .all()
    )
    
    return [
        {
            "payout_id": p.payout_id,
            "payout_batch_id": p.payout_batch_id,
            "entity_type": p.entity_type,
            "owner_type": p.owner_type,
            "entity_id": p.entity_id,
            "gross_amount": float(p.gross_amount),
            "net_amount": float(p.net_amount),
            "paid_amount": float(p.paid_amount),
            "status": p.status,
            "created_at_utc": p.created_at_utc,
        }
        for p in payouts
    ]
