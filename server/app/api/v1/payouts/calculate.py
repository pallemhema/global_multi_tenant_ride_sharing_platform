from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_app_admin
from app.models.core.payouts.payout_batch import PayoutBatch
from app.models.core.payouts.payouts import Payout
from app.models.core.accounting.ledger import FinancialLedger

router = APIRouter(
    prefix="/payouts/batches",
    tags=["Payouts"],
    dependencies=[Depends(require_app_admin)],
)


@router.post("/{batch_id}/calculate")
def calculate_payouts(
    batch_id: int,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    # --------------------------------------------------
    # 1️⃣ Lock batch
    # --------------------------------------------------
    batch = (
        db.query(PayoutBatch)
        .filter(PayoutBatch.payout_batch_id == batch_id)
        .with_for_update()
        .first()
    )

    if not batch:
        raise HTTPException(404, "Batch not found")

    if batch.status not in ("initiated", "processing"):
        raise HTTPException(400, f"Invalid batch state: {batch.status}")

    batch.status = "processing"
    db.flush()

    # --------------------------------------------------
    # 2️⃣ Fetch unsettled CREDIT ledger rows
    # --------------------------------------------------
    credit_rows = (
        db.query(
            FinancialLedger.entity_type,
            FinancialLedger.entity_id,
            FinancialLedger.currency_code,
            FinancialLedger.transaction_type,
            func.sum(FinancialLedger.amount).label("credit_total"),
        )
        .filter(
            FinancialLedger.entry_type == "CREDIT",
            FinancialLedger.payout_batch_id.is_(None),
            FinancialLedger.tenant_id == batch.tenant_id,
            FinancialLedger.country_id == batch.country_id,
            FinancialLedger.credited_at_utc >= batch.period_start_utc,
            FinancialLedger.credited_at_utc <= batch.period_end_utc,
        )
        .group_by(
            FinancialLedger.entity_type,
            FinancialLedger.entity_id,
            FinancialLedger.currency_code,
            FinancialLedger.transaction_type,
        )
        .all()
    )

    payouts_created = 0
    total_payable = 0.0

    # --------------------------------------------------
    # 3️⃣ Create payouts per grouped entity
    # --------------------------------------------------
    for row in credit_rows:

        entity_type = row.entity_type
        entity_id = row.entity_id
        currency_code = row.currency_code
        transaction_type = row.transaction_type
        credit_total = float(row.credit_total or 0)

        # Skip invalid / zero amounts
        if credit_total <= 0:
            continue

        # Skip platform earnings
        if entity_type == "platform":
            continue

        # --------------------------------------------------
        # Determine owner type correctly
        # --------------------------------------------------
        owner_type = None

        if entity_type == "owner":
            if transaction_type == "fleet_earnings":
                owner_type = "fleet_owner"
            else:
                owner_type = "driver"

        elif entity_type == "tenant":
            owner_type = None

        else:
            continue

        # --------------------------------------------------
        # Create payout
        # --------------------------------------------------
        payout = Payout(
            payout_batch_id=batch_id,
            entity_type=entity_type,
            owner_type=owner_type,
            entity_id=entity_id,
            currency_code=currency_code,
            gross_amount=credit_total,
            fee_amount=0.0,
            net_amount=credit_total,
            paid_amount=credit_total,
            status="pending",
        )

        db.add(payout)
        db.flush()

        # --------------------------------------------------
        # 4️⃣ Mark ONLY matching ledger rows as settled
        # --------------------------------------------------
        db.query(FinancialLedger).filter(
            FinancialLedger.entity_type == entity_type,
            FinancialLedger.entity_id == entity_id,
            FinancialLedger.currency_code == currency_code,
            FinancialLedger.transaction_type == transaction_type,
            FinancialLedger.entry_type == "CREDIT",
            FinancialLedger.payout_batch_id.is_(None),
            FinancialLedger.credited_at_utc >= batch.period_start_utc,
            FinancialLedger.credited_at_utc <= batch.period_end_utc,
        ).update(
            {"payout_batch_id": batch_id},
            synchronize_session=False,
        )

        payouts_created += 1
        total_payable += credit_total

    # --------------------------------------------------
    # 5️⃣ Finalize batch
    # --------------------------------------------------
    batch.status = "calculated"
    batch.updated_at_utc = now

    db.commit()

    return {
        "batch_id": batch_id,
        "payouts_created": payouts_created,
        "total_payable": round(total_payable, 2),
        "status": batch.status,
    }
