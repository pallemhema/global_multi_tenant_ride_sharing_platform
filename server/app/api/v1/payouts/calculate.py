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

@router.post("/{batch_id}/calculate")
def calculate_payouts(
    batch_id: int,
    db: Session = Depends(get_db),
):
    batch = (
        db.query(PayoutBatch)
        .filter(PayoutBatch.payout_batch_id == batch_id)
        .with_for_update()
        .first()
    )

    if not batch:
        raise HTTPException(404, "Payout batch not found")

    if batch.status not in ("initiated", "processing"):
        raise HTTPException(
            400,
            f"Cannot calculate payouts in status {batch.status}",
        )

    batch.status = "processing"
    db.flush()

    # --------------------------------------------------
    # 1️⃣ Select ONLY unsettled CREDIT ledger rows
    # --------------------------------------------------
    credit_rows = (
        db.query(
            FinancialLedger.entity_type,
            FinancialLedger.entity_id,
            FinancialLedger.transaction_type,
            func.sum(FinancialLedger.amount).label("credit_total"),
        )
        .filter(
            FinancialLedger.entry_type == "CREDIT",
            FinancialLedger.payout_batch_id == None,
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
    # 2️⃣ Create payouts per entity
    # --------------------------------------------------
    for row in credit_rows:

        entity_type = row.entity_type
        entity_id = row.entity_id
        transaction_type = row.transaction_type
        credit_total = float(row.credit_total or 0)

        # Skip platform rows
        if entity_type == "platform":
            continue

        # Determine owner type
        if entity_type == "tenant":
            owner_type = None
        elif entity_type == "owner":
            if transaction_type == "driver_earning":
                owner_type = "driver"
            elif transaction_type == "fleet_earnings":
                owner_type = "fleet_owner"
            else:
                continue
        else:
            continue

        # Idempotency safety
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
            owner_type=owner_type,
            entity_id=entity_id,
            currency_code=batch.currency_code,
            gross_amount=credit_total,
            fee_amount=0,
            net_amount=credit_total,
            paid_amount=credit_total,
            status="pending",
        )

        db.add(payout)
        db.flush()

        # --------------------------------------------------
        # 3️⃣ Mark CREDIT rows as settled (assign batch)
        # --------------------------------------------------
        db.query(FinancialLedger).filter(
            FinancialLedger.entity_type == entity_type,
            FinancialLedger.entity_id == entity_id,
            FinancialLedger.entry_type == "CREDIT",
            FinancialLedger.payout_batch_id == None,
            FinancialLedger.credited_at_utc >= batch.period_start_utc,
            FinancialLedger.credited_at_utc <= batch.period_end_utc,
        ).update(
            {"payout_batch_id": batch_id},
            synchronize_session=False,
        )

        payouts_created += 1
        total_payable += credit_total

    db.commit()

    return {
        "batch_id": batch_id,
        "payouts_created": payouts_created,
        "total_payable": round(total_payable, 2),
    }


