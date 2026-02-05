# 🏦 Payout & Settlement Implementation

## Overview

Complete payout batch creation and settlement workflow for ride-sharing platform. Handles:
- Weekly/periodic payout batch creation
- Multi-currency settlement (per tenant)
- Owner and tenant payouts (with wallet balance tracking)
- Atomic payout processing with ledger trail
- Status tracking per payout item

## Golden Rules

1. **Payouts are derived from ledger**
   - Wallet balances come from FinancialLedger entries
   - Ledger is immutable; payouts just distribute the balance

2. **Only positive balances are paid out**
   - Owner wallet balance > 0 → owner is owed money
   - Tenant wallet balance > 0 → tenant is owed money
   - Negative balances (offline debt) carry forward to next period

3. **No new ledger entries for payouts**
   - Earning ledger entry created during payment confirmation
   - Payout just marks when money is actually transferred
   - Wallet transaction recorded for audit trail

4. **Tax is never paid out**
   - Tax stored as liability in FinancialLedger with entity_type='tax'
   - Platform collects tax; no wallet entry for tax
   - Tax can be moved to government account separately

5. **Platform has no wallet**
   - Platform fees go to FinancialLedger with entity_type='platform'
   - Platform tracks fees in ledger, not wallet
   - Settlement of platform fees is separate process

## Implementation

### PayoutService Methods

Location: /app/core/payouts/payout_service.py

1. create_payout_batch(db, tenant_id, period_start, period_end, currency_code='USD')
   - Queries wallets with positive balance
   - Creates PayoutBatch and PayoutItem records
   - Returns batch details with items_count and total_amount

2. process_payout_item(db, payout_item_id, confirmed_by_user_id=None)
   - Marks item as 'completed' with paid_at_utc timestamp
   - Updates owner/tenant wallet: balance -= payout_amount
   - Creates wallet transaction record for audit trail
   - Atomic: all or nothing with rollback on error

3. process_batch(db, payout_batch_id, confirmed_by_user_id=None)
   - Processes all pending items in batch
   - Marks batch as 'completed' when done
   - Handles individual item failures gracefully
   - Returns completion summary

### API Endpoints

Location: /app/api/v1/payments/payout_settlement.py

1. POST /tenant-admin/payouts/create-batch
   - Query params: period_start_date, period_end_date, currency_code
   - Returns batch details with items_count
   - Requires tenant_admin role

2. POST /tenant-admin/payouts/{batch_id}/process
   - Process all pending items in batch
   - Returns items_processed count and completed_at_utc
   - Requires tenant_admin role and batch ownership

3. GET /tenant-admin/payouts/{batch_id}
   - Retrieve batch details with item-level status
   - Shows each item's payOUT_amount and paid_at_utc
   - Requires tenant_admin role

## Wallet Updates

When payout item is processed:

Owner Wallet:
- old balance: 285.50 (platform owes owner)
- new balance: 0.00 (after payout)
- transaction created: type='payout', amount=-285.50

Tenant Wallet:
- old balance: 14920.00 (platform owes tenant)
- new balance: 0.00 (after payout)
- transaction created: type='payout', amount=-14920.00

## Error Handling

- Item must exist: ValueError if payout_item not found
- Item must be pending: ValueError if status != 'pending'
- Wallet must exist: ValueError if owner/tenant wallet missing
- Entity type must be valid: ValueError if not 'owner' or 'tenant'
- Atomic rollback: any error triggers db.rollback() for entire transaction

## Logging

Payout operations log key milestones:

[PAYOUT_BATCH_CREATED] batch_id=123 tenant=42
[PAYOUT_BATCH_CREATED] batch_id=123 items=47 total=15420.50 USD
[PAYOUT_PROCESSED] item_id=456 Owner 99 amount=285.50 USD
[PAYOUT_PROCESSED] item_id=457 Tenant 42 amount=14920.00 USD
[PAYOUT_BATCH_COMPLETED] batch_id=123 items_processed=47/47
[PAYOUT_ERROR] Payout item 999 not found

## Integration

Payout flow after payment confirmation:

1. Payment completion creates FinancialLedger entries (owner/tenant earning)
2. Ledger entries update owner/tenant wallet balances
3. create_payout_batch() fetches positive wallet balances
4. Creates PayoutBatch with PayoutItems (one per owner/tenant)
5. process_batch() updates wallet balances to zero
6. Wallet transactions created for audit trail

## Future Work

- Bank account integration (real payout processing)
- Scheduled batch creation (daily/weekly automation)
- Payout reconciliation (verify bank transfer success)
- Negative balance blocking (prevent trips for high-debt owners)
- Multi-currency conversion rate locking
- Payout reversal (handle failed bank transfers)
- Reporting dashboard (tenant sees payout history)
- Tax settlement (move tax liability to government account)
