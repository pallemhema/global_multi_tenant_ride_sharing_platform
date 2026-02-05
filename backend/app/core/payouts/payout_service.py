"""
Payout Service - handles batch creation and settlement processing.

Golden Rules:
- Payouts are derived from ledger (wallet balances)
- Only positive balances are paid out
- Wallet update is atomic (wallet balance goes to zero)
- Tax is never paid out (it's a liability)
- Platform has no wallet (no payouts to platform)
- No new ledger entries created for payouts (ledger already has the earning entry)
"""

from decimal import Decimal
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.core.payouts.payout_batch import PayoutBatch, PayoutItem
from app.models.core.wallets.owner_wallet import OwnerWallet
from app.models.core.wallets.tenant_wallet import TenantWallet
from app.models.core.wallets.owner_wallet_transactions import OwnerWalletTransaction
from app.models.core.wallets.tenant_wallet_transactions import TenantWalletTransaction


class PayoutService:
    """
    Service to create and process payout batches.
    
    Ensures:
    - Only positive wallet balances are paid out
    - Ledger entries created for every payout
    - Wallets updated atomically
    - Audit trail maintained
    """

    @staticmethod
    def create_payout_batch(
        db: Session,
        tenant_id: int,
        period_start: datetime,
        period_end: datetime,
        currency_code: str = "USD",
    ) -> dict:
        """
        Create a payout batch for a tenant for a given period.
        
        Fetches all owners and tenants with positive balances and creates
        payout items for each.
        
        Args:
            db: Database session
            tenant_id: Tenant ID
            period_start: Start of settlement period
            period_end: End of settlement period
            currency_code: Settlement currency
            
        Returns:
            dict with batch details and items count
        """
        now = datetime.now(timezone.utc)
        
        # Create batch
        payout_batch = PayoutBatch(
            tenant_id=tenant_id,
            period_start_date=period_start,
            period_end_date=period_end,
            currency_code=currency_code,
            batch_status="pending",
            items_count=0,
            items_completed=0,
        )
        db.add(payout_batch)
        db.flush()
        
        print(f"[PAYOUT_BATCH_CREATED] batch_id={payout_batch.payout_batch_id} tenant={tenant_id}")
        
        # Fetch all owners with positive balance in this currency
        owner_wallets = db.query(OwnerWallet).filter(
            OwnerWallet.tenant_id == tenant_id,
            OwnerWallet.currency_code == currency_code,
            OwnerWallet.balance > Decimal("0"),
        ).all()
        
        total_amount = Decimal("0")
        items_count = 0
        
        # Create payout items for owners
        for owner_wallet in owner_wallets:
            payout_item = PayoutItem(
                payout_batch_id=payout_batch.payout_batch_id,
                tenant_id=tenant_id,
                entity_type="owner",
                entity_id=owner_wallet.owner_id,
                owner_type=owner_wallet.owner_type,
                currency_code=currency_code,
                payout_amount=float(owner_wallet.balance),
                item_status="pending",
            )
            db.add(payout_item)
            total_amount += owner_wallet.balance
            items_count += 1
        
        # Fetch tenant wallet with positive balance
        tenant_wallet = db.query(TenantWallet).filter(
            TenantWallet.tenant_id == tenant_id,
            TenantWallet.currency_code == currency_code,
            TenantWallet.balance > Decimal("0"),
        ).first()
        
        if tenant_wallet:
            payout_item = PayoutItem(
                payout_batch_id=payout_batch.payout_batch_id,
                tenant_id=tenant_id,
                entity_type="tenant",
                entity_id=tenant_id,
                currency_code=currency_code,
                payout_amount=float(tenant_wallet.balance),
                item_status="pending",
            )
            db.add(payout_item)
            total_amount += tenant_wallet.balance
            items_count += 1
        
        # Update batch totals
        payout_batch.items_count = items_count
        payout_batch.total_amount = float(total_amount)
        db.add(payout_batch)
        
        db.commit()
        
        print(
            f"[PAYOUT_BATCH_CREATED] batch_id={payout_batch.payout_batch_id} "
            f"items={items_count} total={total_amount} {currency_code}"
        )
        
        return {
            "payout_batch_id": payout_batch.payout_batch_id,
            "tenant_id": tenant_id,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "currency_code": currency_code,
            "total_amount": float(total_amount),
            "items_count": items_count,
            "batch_status": "pending",
        }

    @staticmethod
    def process_payout_item(
        db: Session,
        payout_item_id: int,
        confirmed_by_user_id: int = None,
    ) -> dict:
        """
        Process a single payout item (mark as paid and update wallet).
        
        NOTE: No new ledger entry is created. The earning entry was already
        created during payment confirmation. This just marks when the money
        is actually paid out.
        
        Args:
            db: Database session
            payout_item_id: Payout item ID
            confirmed_by_user_id: User processing the payout
            
        Returns:
            dict with payout details and wallet snapshot
        """
        
        try:
            now = datetime.now(timezone.utc)
            
            # Fetch payout item
            payout_item = db.query(PayoutItem).filter(
                PayoutItem.payout_item_id == payout_item_id
            ).with_for_update().first()
            
            if not payout_item:
                raise ValueError(f"Payout item {payout_item_id} not found")
            
            if payout_item.item_status != "pending":
                raise ValueError(f"Payout item status is '{payout_item.item_status}', must be 'pending'")
            
            payout_amount = Decimal(str(payout_item.payout_amount))
            
            # Mark item as completed
            payout_item.item_status = "completed"
            payout_item.paid_at_utc = now
            db.add(payout_item)
            
            # Update wallet balances
            if payout_item.entity_type == "owner":
                owner_wallet = db.query(OwnerWallet).filter(
                    OwnerWallet.owner_id == payout_item.entity_id,
                    OwnerWallet.owner_type == payout_item.owner_type,
                    OwnerWallet.tenant_id == payout_item.tenant_id,
                    OwnerWallet.currency_code == payout_item.currency_code,
                ).with_for_update().first()
                
                if not owner_wallet:
                    raise ValueError(
                        f"Owner wallet not found for owner {payout_item.entity_id}"
                    )
                
                old_balance = Decimal(str(owner_wallet.balance))
                owner_wallet.balance = old_balance - payout_amount
                owner_wallet.last_updated_utc = now
                db.add(owner_wallet)
                db.flush()
                
                # Record transaction
                owner_txn = OwnerWalletTransaction(
                    fleet_owner_wallet_id=owner_wallet.owner_wallet_id,
                    trip_id=None,
                    transaction_type="payout",
                    amount=-float(payout_amount),
                    created_at_utc=now,
                )
                db.add(owner_txn)
                
                new_balance = Decimal(str(owner_wallet.balance))
                entity_name = f"Owner {payout_item.entity_id}"
                wallet_snapshot = {
                    "owner_id": payout_item.entity_id,
                    "old_balance": float(old_balance),
                    "new_balance": float(new_balance),
                }
            
            elif payout_item.entity_type == "tenant":
                tenant_wallet = db.query(TenantWallet).filter(
                    TenantWallet.tenant_id == payout_item.entity_id,
                    TenantWallet.currency_code == payout_item.currency_code,
                ).with_for_update().first()
                
                if not tenant_wallet:
                    raise ValueError(f"Tenant wallet not found for tenant {payout_item.entity_id}")
                
                old_balance = Decimal(str(tenant_wallet.balance))
                tenant_wallet.balance = old_balance - payout_amount
                tenant_wallet.last_updated_utc = now
                db.add(tenant_wallet)
                db.flush()
                
                # Record transaction
                tenant_txn = TenantWalletTransaction(
                    tenant_wallet_id=tenant_wallet.tenant_wallet_id,
                    trip_id=None,
                    transaction_type="payout",
                    amount=-float(payout_amount),
                    created_at_utc=now,
                )
                db.add(tenant_txn)
                
                new_balance = Decimal(str(tenant_wallet.balance))
                entity_name = f"Tenant {payout_item.entity_id}"
                wallet_snapshot = {
                    "tenant_id": payout_item.entity_id,
                    "old_balance": float(old_balance),
                    "new_balance": float(new_balance),
                }
            
            else:
                raise ValueError(f"Unknown entity_type: {payout_item.entity_type}")
            
            db.commit()
            
            print(
                f"[PAYOUT_PROCESSED] item_id={payout_item_id} "
                f"{entity_name} amount={payout_amount} {payout_item.currency_code}"
            )
            
            return {
                "payout_item_id": payout_item_id,
                "entity_type": payout_item.entity_type,
                "entity_id": payout_item.entity_id,
                "payout_amount": float(payout_amount),
                "currency_code": payout_item.currency_code,
                "item_status": "completed",
                "paid_at_utc": payout_item.paid_at_utc.isoformat() if payout_item.paid_at_utc else None,
                "wallet_snapshot": wallet_snapshot,
            }
        
        except Exception as e:
            db.rollback()
            print(f"[PAYOUT_ERROR] {str(e)}")
            raise

    @staticmethod
    def process_batch(
        db: Session,
        payout_batch_id: int,
        confirmed_by_user_id: int = None,
    ) -> dict:
        """
        Process all pending items in a payout batch.
        
        Args:
            db: Database session
            payout_batch_id: Payout batch ID
            confirmed_by_user_id: User processing the batch
            
        Returns:
            dict with batch completion details
        """
        
        # Fetch batch
        payout_batch = db.query(PayoutBatch).filter(
            PayoutBatch.payout_batch_id == payout_batch_id
        ).with_for_update().first()
        
        if not payout_batch:
            raise ValueError(f"Payout batch {payout_batch_id} not found")
        
        if payout_batch.batch_status != "pending":
            raise ValueError(f"Batch status is '{payout_batch.batch_status}', must be 'pending'")
        
        # Fetch all pending items
        pending_items = db.query(PayoutItem).filter(
            PayoutItem.payout_batch_id == payout_batch_id,
            PayoutItem.item_status == "pending",
        ).all()
        
        if not pending_items:
            payout_batch.batch_status = "completed"
            payout_batch.processed_at_utc = datetime.now(timezone.utc)
            db.add(payout_batch)
            db.commit()
            return {
                "payout_batch_id": payout_batch_id,
                "batch_status": "completed",
                "items_processed": 0,
            }
        
        # Process each item
        completed_count = 0
        for item in pending_items:
            try:
                PayoutService.process_payout_item(
                    db=db,
                    payout_item_id=item.payout_item_id,
                    confirmed_by_user_id=confirmed_by_user_id,
                )
                completed_count += 1
            except Exception as e:
                print(f"[PAYOUT_ITEM_FAILED] item_id={item.payout_item_id} error={str(e)}")
                item.item_status = "failed"
                item.error_message = str(e)
                db.add(item)
                db.commit()
        
        # Mark batch as completed
        payout_batch.batch_status = "completed"
        payout_batch.items_completed = completed_count
        payout_batch.processed_at_utc = datetime.now(timezone.utc)
        db.add(payout_batch)
        db.commit()
        
        print(
            f"[PAYOUT_BATCH_COMPLETED] batch_id={payout_batch_id} "
            f"items_processed={completed_count}/{payout_batch.items_count}"
        )
        
        return {
            "payout_batch_id": payout_batch_id,
            "batch_status": "completed",
            "items_processed": completed_count,
            "total_items": payout_batch.items_count,
            "processed_at_utc": payout_batch.processed_at_utc.isoformat() if payout_batch.processed_at_utc else None,
        }
