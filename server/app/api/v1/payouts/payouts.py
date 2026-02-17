from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timezone, timedelta

from app.core.dependencies import get_db
from app.core.security.roles import require_app_admin

from app.models.core.accounting.ledger import FinancialLedger
from app.models.core.payouts.payout_batch import PayoutBatch
from app.models.core.payouts.payouts import Payout
from app.models.core.wallets.owner_wallet import OwnerWallet
from app.models.core.wallets.tenant_wallet import TenantWallet
from app.models.core.payments.payments import Payment

router = APIRouter(
    prefix="/payouts",
    tags=["Payouts"],
    dependencies=[Depends(require_app_admin)],
)

@router.get("/unsettled-periods")
def get_unsettled_periods(
    tenant_id: int,
    country_id: int,
    mode: str = "weekly",  # daily | weekly | monthly
    db: Session = Depends(get_db),
):
    if mode not in ["daily", "weekly", "monthly"]:
        raise HTTPException(400, "Invalid mode")

    if mode == "daily":
        trunc_unit = "day"
        interval_expr = "1 day"
    elif mode == "weekly":
        trunc_unit = "week"
        interval_expr = "1 week"
    else:
        trunc_unit = "month"
        interval_expr = "1 month"

    period_start = func.date_trunc(trunc_unit, FinancialLedger.credited_at_utc)

    rows = (
        db.query(
            period_start.label("period_start"),
            func.sum(FinancialLedger.amount).label("total_amount"),
            func.count(FinancialLedger.ledger_id).label("entries"),
        )
        .filter(
            FinancialLedger.entry_type == "CREDIT",
            FinancialLedger.payout_batch_id == None,
            FinancialLedger.tenant_id == tenant_id,
            FinancialLedger.country_id == country_id,
            FinancialLedger.entity_type.in_(["owner", "tenant"]),
        )
        .group_by(period_start)
        .order_by(period_start)
        .all()
    )

    result = []

    for r in rows:
        if mode == "daily":
            period_end = r.period_start + timedelta(days=1) - timedelta(microseconds=1)
        elif mode == "weekly":
            period_end = r.period_start + timedelta(weeks=1) - timedelta(microseconds=1)
        else:
            # monthly
            next_month = (r.period_start.replace(day=28) + timedelta(days=4)).replace(day=1)
            period_end = next_month - timedelta(microseconds=1)

        result.append(
            {
                "period_start": r.period_start,
                "period_end": period_end,
                "entries": r.entries,
                "total_amount": float(r.total_amount or 0),
            }
        )

    return result

@router.post("/create-from-period")
def create_batch_from_period(
    tenant_id: int,
    country_id: int,
    period_start: datetime,
    period_end: datetime,
    db: Session = Depends(get_db),
):

    # 1️⃣ Check unsettled ledger exists
    unsettled_exists = (
        db.query(FinancialLedger.ledger_id)
        .filter(
            FinancialLedger.entry_type == "CREDIT",
            FinancialLedger.payout_batch_id == None,
            FinancialLedger.tenant_id == tenant_id,
            FinancialLedger.country_id == country_id,
            FinancialLedger.entity_type.in_(["owner", "tenant"]),
            FinancialLedger.credited_at_utc >= period_start,
            FinancialLedger.credited_at_utc <= period_end,
        )
        .first()
    )

    if not unsettled_exists:
        raise HTTPException(400, "No unsettled ledger rows in this period")

    # 2️⃣ Prevent duplicate overlapping batch
    overlapping = (
        db.query(PayoutBatch)
        .filter(
            PayoutBatch.tenant_id == tenant_id,
            PayoutBatch.country_id == country_id,
            PayoutBatch.period_start_utc == period_start,
            PayoutBatch.period_end_utc == period_end,
        )
        .first()
    )

    if overlapping:
        return {
            "batch_id": overlapping.payout_batch_id,
            "status": overlapping.status,
            "message": "Batch already exists"
        }

    batch = PayoutBatch(
        tenant_id=tenant_id,
        country_id=country_id,
        period_start_utc=period_start,
        period_end_utc=period_end,
        status="initiated",
    )

    db.add(batch)
    db.commit()

    return {
        "batch_id": batch.payout_batch_id,
        "status": batch.status,
    }

@router.get("/batches/details/{batch_id}")
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
                "currency_code":p.currency_code,
                "gross_amount": float(p.gross_amount),
                "net_amount": float(p.net_amount),
                "paid_amount": float(p.paid_amount),
                "status": p.status,
            }
            for p in payouts
        ],
    }


@router.get("/batches")
def list_batches(db: Session = Depends(get_db)):
    rows = (
        db.query(
            PayoutBatch.payout_batch_id,
            PayoutBatch.tenant_id,
            PayoutBatch.country_id,
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
            "period_start_utc": r.period_start_utc,
            "period_end_utc": r.period_end_utc,
            "status": r.status,
            "total_payouts": r.total_payouts,
            "total_amount": float(r.total_amount),
            "created_at_utc": r.created_at_utc,
        }
        for r in rows
    ]


@router.get("/batches/{batch_id}/payments")
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

@router.get("/batches/{batch_id}")
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
             "currency_code":p.currency_code,
            "gross_amount": float(p.gross_amount),
            "net_amount": float(p.net_amount),
            "paid_amount": float(p.paid_amount),
            "status": p.status,
            "created_at_utc": p.created_at_utc,
        }
        for p in payouts
    ]


