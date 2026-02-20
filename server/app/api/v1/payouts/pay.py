from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_app_admin
from app.models.core.payouts.payouts import Payout
from app.models.core.payouts.payout_batch import PayoutBatch
from app.models.core.accounting.ledger import FinancialLedger

from app.models.core.wallets.owner_wallet import OwnerWallet
from app.models.core.wallets.tenant_wallet import TenantWallet
from app.schemas.core.payouts.payout_batch import ExecutePayoutBatchRequest, PayPayoutRequest

router = APIRouter(
    prefix="/payouts/batches",
    tags=["Payouts"],
    dependencies=[Depends(require_app_admin)],
)


@router.post("/{batch_id}/payouts/{payout_id}/pay")
def pay_single_payout(
    batch_id: int,
    payout_id: int,
    payload: PayPayoutRequest,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    payout = (
        db.query(Payout)
        .filter(Payout.payout_id == payout_id)
        .with_for_update()
        .first()
    )

    if not payout:
        raise HTTPException(404, "Payout not found")

    if payout.payout_batch_id != batch_id:
        raise HTTPException(400, "Payout does not belong to this batch")

    # -------------------------
    # Idempotency check
    # -------------------------
    if payout.idempotency_key == payload.idempotency_key:
        return {
            "payout_id": payout.payout_id,
            "status": payout.status,
            "paid_amount": float(payout.paid_amount),
        }

    if payout.idempotency_key is not None:
        raise HTTPException(
            409,
            "Payout already attempted with different idempotency key",
        )

    if payout.status not in ["pending", "failed"]:
        return {
            "payout_id": payout.payout_id,
            "status": payout.status,
        }


    batch = db.get(PayoutBatch, payout.payout_batch_id)

    amount = payout.paid_amount

    # -------------------------
    # Lock wallet
    # -------------------------
    if payout.entity_type == "tenant":
        wallet = (
            db.query(TenantWallet)
            .filter(
                TenantWallet.tenant_id == payout.entity_id,
                TenantWallet.currency_code == payout.currency_code,
            )
            .with_for_update()
            .first()
        )
    else:
        wallet = (
            db.query(OwnerWallet)
            .filter(
                OwnerWallet.owner_type == payout.owner_type,
                OwnerWallet.currency_code == payout.currency_code,
                (
                    (OwnerWallet.driver_id == payout.entity_id)
                    | (OwnerWallet.fleet_owner_id == payout.entity_id)
                ),
            )
            .with_for_update()
            .first()
        )

    if not wallet:
        raise HTTPException(400, "Wallet not found")

    if wallet.balance < amount:
        raise HTTPException(400, "Insufficient wallet balance")

    # -------------------------
    # Insert DEBIT ledger
    # -------------------------
    ledger = FinancialLedger(
        payment_id=None,
        trip_id=None,
        payout_id=payout.payout_id,
        tenant_id=batch.tenant_id,
        country_id=batch.country_id,
        entity_type=payout.entity_type,
        entity_id=payout.entity_id,
        transaction_type="payout",
        amount=amount,
        currency_code=payout.currency_code,
        entry_type="DEBIT",
        debited_at_utc=now,
    )

    db.add(ledger)
    db.flush()

    # -------------------------
    # Update wallet & payout
    # -------------------------
    wallet.balance -= amount

    payout.status = "paid"
    payout.payout_method = payload.payout_method
    payout.paid_at_utc = now
    payout.idempotency_key = payload.idempotency_key

    # -------------------------
    # Batch completion check
    # -------------------------
    remaining_exists = (
            db.query(Payout)
            .filter(
                Payout.payout_batch_id == batch_id,
                Payout.status != "paid",
            )
            .first()
        )

    if not remaining_exists:
        batch.status = "completed"
        batch.processed_at_utc = now



    db.commit()

    return {
        "payout_id": payout.payout_id,
        "status": "paid",
        "paid_amount": float(payout.paid_amount),
        "wallet_balance": float(wallet.balance),
    }


@router.post("/{batch_id}/execute")
def execute_payout_batch(
    batch_id: int,
    payload: ExecutePayoutBatchRequest,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    # --------------------------------------------------
    #  Lock payout batch
    # --------------------------------------------------
    batch = (
        db.query(PayoutBatch)
        .filter(PayoutBatch.payout_batch_id == batch_id)
        .with_for_update()
        .first()
    )

    if not batch:
        raise HTTPException(404, "Payout batch not found")

    if batch.status != "calculated":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot execute batch in status {batch.status}. Batch must be in 'calculated' status.",
        )

    # --------------------------------------------------
    # idempotency check (CRITICAL)
    # --------------------------------------------------
    if batch.execution_idempotency_key == payload.execution_idempotency_key:
        return {
            "batch_id": batch_id,
            "status": batch.status,
            "message": "Batch already executed (idempotent)",
        }

    if batch.execution_idempotency_key is not None:
        raise HTTPException(
            409,
            "Batch already executed with a different idempotency key",
        )

    # Lock execution
    batch.execution_idempotency_key = payload.execution_idempotency_key
    batch.status = "processing"
    db.commit()

    # --------------------------------------------------
    # Fetch pending payouts
    # --------------------------------------------------
    payouts = (
        db.query(Payout)
        .filter(
            Payout.payout_batch_id == batch_id,
            Payout.status == "pending",
        )
        .all()
    )

    success = 0
    failed = 0

    # --------------------------------------------------
    #  Process payouts one-by-one (ISOLATED)
    # --------------------------------------------------
    for payout in payouts:
        try:
            with db.begin():

                payout = (
                    db.query(Payout)
                    .filter(Payout.payout_id == payout.payout_id)
                    .with_for_update()
                    .first()
                )

                if payout.status != "pending":
                    continue

                amount = payout.paid_amount

                # ------------------------------------------
                # Lock wallet
                # ------------------------------------------
                if payout.entity_type == "tenant":
                    wallet = (
                        db.query(TenantWallet)
                        .filter(
                            TenantWallet.tenant_id == payout.entity_id,
                            TenantWallet.currency_code == payout.currency_code,
                        )
                        .with_for_update()
                        .first()
                    )
                else:
                    wallet = (
                        db.query(OwnerWallet)
                        .filter(
                            OwnerWallet.owner_type == payout.owner_type,
                            OwnerWallet.currency_code == payout.currency_code,
                            (
                                (OwnerWallet.driver_id == payout.entity_id)
                                | (OwnerWallet.fleet_owner_id == payout.entity_id)
                            ),
                        )
                        .with_for_update()
                        .first()
                    )

                if not wallet:
                    raise Exception("Wallet not found")

                if wallet.balance < amount:
                    raise Exception("Insufficient wallet balance")

                # ------------------------------------------
                # Ledger DEBIT (SOURCE OF TRUTH)
                # ------------------------------------------
                ledger = FinancialLedger(
                    payment_id=None,
                    trip_id=None,
                    payout_id=payout.payout_id,
                    tenant_id=batch.tenant_id,
                    country_id=batch.country_id,
                    entity_type=payout.entity_type,
                    entity_id=payout.entity_id,
                    transaction_type="payout",
                    amount=amount,
                    currency_code=payout.currency_code,
                    entry_type="DEBIT",
                    debited_at_utc=now,
                )

                db.add(ledger)
                db.flush()  # ensure ledger_id is created

                # ------------------------------------------
                # Update wallet + payout
                # ------------------------------------------
                wallet.balance -= amount

                payout.status = "paid"
                payout.payout_method = payload.payout_method
                payout.paid_at_utc = now

                success += 1

        except Exception:
            db.rollback()
            failed += 1

            db.query(Payout).filter(
                Payout.payout_id == payout.payout_id
            ).update(
                {"status": "failed"}
            )
            db.commit()

    # --------------------------------------------------
    # Finalize batch
    # --------------------------------------------------
    batch.status = "completed" if failed == 0 else "partial"
    batch.processed_at_utc = now
    db.commit()

    return {
        "batch_id": batch_id,
        "total": len(payouts),
        "paid": success,
        "failed": failed,
        "status": batch.status,
    }
