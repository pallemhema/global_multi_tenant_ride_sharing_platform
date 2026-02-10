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

router = APIRouter(prefix="/payout-batches", tags=["Payouts"])


@router.post("", response_model=PayoutBatchResponse)
def create_payout_batch(
    payload: PayoutBatchCreateRequest,
    db: Session = Depends(get_db),
    app: dict = Depends(require_app_admin),
):
    # -----------------------------------------------------
    # 1️⃣ Validate tenant operates in this country
    # -----------------------------------------------------
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

    # -----------------------------------------------------
    # 2️⃣ Fetch country default currency
    # -----------------------------------------------------
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
    # -----------------------------------------------------
    # 3️⃣ Prevent overlapping payout batches
    # -----------------------------------------------------
    overlapping_batch = (
        db.query(PayoutBatch)
        .filter(
            PayoutBatch.tenant_id == payload.tenant_id,
            PayoutBatch.country_id == payload.country_id,
            and_(
                PayoutBatch.period_start_utc <= payload.period_end_utc,
                PayoutBatch.period_end_utc >= payload.period_start_utc,
            ),
        )
        .first()
    )

    if overlapping_batch:
        raise HTTPException(
            status_code=409,
            detail="Overlapping payout batch already exists",
        )

    # -----------------------------------------------------
    # 4️⃣ Create payout batch
    # -----------------------------------------------------
    payout_batch = PayoutBatch(
        tenant_id=payload.tenant_id,
        country_id=payload.country_id,
        currency_code=currency_code,
        period_start_utc=payload.period_start_utc,
        period_end_utc=payload.period_end_utc,
        status="initiated",
    )

    db.add(payout_batch)
    db.commit()
    db.refresh(payout_batch)

    # -----------------------------------------------------
    # 5️⃣ Return response
    # -----------------------------------------------------
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
            Payment.country_id == batch.country_id,
            Payment.created_at_utc >= batch.period_start_utc,
            Payment.created_at_utc <= batch.period_end_utc,
            Payment.status == "completed",
        )
        .all()
    )

    return payments

@router.get("/{batch_id}/payouts")
def list_batch_payout(
    batch_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_app_admin),
):
    return (
        db.query(Payout)
        .filter(Payout.payout_batch_id == batch_id)
        .all()
    )
