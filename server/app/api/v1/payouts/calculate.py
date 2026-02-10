from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_db
from app.core.security.roles import require_app_admin
from app.models.core.payouts.payout_batch import PayoutBatch
from app.models.core.payouts.payouts import Payout
from app.models.core.accounting.ledger import FinancialLedger
from app.schemas.core.payouts.payout_batch import CalculatePayoutsResponse
router = APIRouter(
    prefix="/payout-batches",
    tags=["Payouts"],
    dependencies=[Depends(require_app_admin)],
)


@router.post("/{batch_id}/calculate", response_model=CalculatePayoutsResponse)
def calculate_payouts(
    batch_id: int,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------
    # 1️⃣ Fetch & lock batch
    # --------------------------------------------------
    batch = (
        db.query(PayoutBatch)
        .filter(PayoutBatch.payout_batch_id == batch_id)
        .with_for_update()
        .first()
    )

    if not batch:
        raise HTTPException(status_code=404, detail="Payout batch not found")

    if batch.status not in ("initiated", "processing"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot calculate payouts in status {batch.status}",
        )

    batch.status = "processing"
    db.flush()

    # --------------------------------------------------
    # 2️⃣ Aggregate CREDIT ledger (THE TRUTH)
    # --------------------------------------------------
    credit_rows = (
        db.query(
            FinancialLedger.entity_type,
            FinancialLedger.entity_id,
            FinancialLedger.transaction_type,
            func.sum(FinancialLedger.amount).label("credit_total"),
        )
        .filter(
            FinancialLedger.tenant_id == batch.tenant_id,
            FinancialLedger.country_id == batch.country_id,
            FinancialLedger.currency_code == batch.currency_code,
            FinancialLedger.entry_type == "CREDIT",
            FinancialLedger.credited_at_utc >= batch.period_start_utc,
            FinancialLedger.credited_at_utc <= batch.period_end_utc,
        )
        .group_by(
            FinancialLedger.entity_type,
            FinancialLedger.entity_id,
            FinancialLedger.transaction_type,
        )
        .all()
    )

    payouts_created = 0
    total_payable = 0.0

    # --------------------------------------------------
    # 3️⃣ Process each earning group
    # --------------------------------------------------
    for row in credit_rows:
        entity_type = row.entity_type
        entity_id = row.entity_id
        transaction_type = row.transaction_type
        credit_total = float(row.credit_total or 0)

        # ----------------------------------------------
        # Determine owner_type (CORRECTLY)
        # ----------------------------------------------
        if entity_type == "tenant":
            owner_type = None
        elif entity_type == "owner":
            if transaction_type == "driver_earning":
                owner_type = "driver"
            elif transaction_type == "fleet_earnings":
                owner_type = "fleet_owner"
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Unknown owner transaction_type: {transaction_type}",
                )
        else:
            continue  # platform / tax never get payouts

        # ----------------------------------------------
        # Subtract already PAID amounts (DEBIT)
        # ----------------------------------------------
        debit_total = (
            db.query(func.coalesce(func.sum(FinancialLedger.amount), 0))
            .filter(
                FinancialLedger.entity_type == entity_type,
                FinancialLedger.entity_id == entity_id,
                FinancialLedger.currency_code == batch.currency_code,
                FinancialLedger.entry_type == "DEBIT",
            )
            .scalar()
        )

        payable = credit_total - float(debit_total or 0)

        if payable <= 0:
            continue

        # ----------------------------------------------
        # Idempotency: skip if payout already exists
        # ----------------------------------------------
        exists = (
            db.query(Payout)
            .filter(
                Payout.payout_batch_id == batch_id,
                Payout.entity_type == entity_type,
                Payout.entity_id == entity_id,
            )
            .first()
        )

        if exists:
            continue

        payout = Payout(
            payout_batch_id=batch_id,
            entity_type=entity_type,
            entity_id=entity_id,
            owner_type=owner_type,
            currency_code=batch.currency_code,
            gross_amount=payable,
            fee_amount=0,
            net_amount=payable,
            paid_amount=payable,
            status="pending",
        )

        db.add(payout)

        payouts_created += 1
        total_payable += payable

    db.commit()

   
    return CalculatePayoutsResponse(
            batch_id=batch_id,
            payouts_created=payouts_created,
            total_payable=round(total_payable, 2),
        )
