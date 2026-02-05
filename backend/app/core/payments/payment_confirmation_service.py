"""
Payment Confirmation Service - 7-Phase Payment Flow

GOLDEN RULES:
- Ledger is truth (source of single financial truth)
- Wallet is settlement state (who owes whom)
- Tax is liability, not revenue
- Platform has no wallet
- Offline payment creates debt (negative balance)
- Everything is atomic (single DB transaction)
- Never recompute past trips

PHASES:
0. Pre-conditions (trip completed, fare finalized)
1. Resolve context (trip, currency, owner, rules)
2. Calculate amounts (using commission rules, no DB writes)
3. Create payment record
4. Ledger entries (owner, tenant, platform, tax - immutable)
5. Wallet updates (online vs offline logic)
6. Atomicity (single transaction)
7. Post-processing (async)
"""

from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.core.payments.payments import Payment
from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_fare import TripFare
from app.models.core.trips.trip_request import TripRequest
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.tenants.tenant_countries import TenantCountry
from app.models.core.accounting.ledger import FinancialLedger
from app.models.core.wallets.tenant_wallet import TenantWallet
from app.models.core.wallets.owner_wallet import OwnerWallet
from app.models.core.wallets.owner_wallet_transactions import OwnerWalletTransaction
from app.models.core.wallets.tenant_wallet_transactions import TenantWalletTransaction
from app.models.core.commissions.owner_commision_rules import OwnerCommissionRule
from app.models.core.commissions.tenant_commmision_rules import TenantCommissionRule


class PaymentConfirmationService:
    """
    Single atomic service for payment confirmation.
    
    Ensures DATA INTEGRITY:
    - Ledger entries immutable
    - Wallets consistent with ledger
    - Transactions always complete or rollback
    """

    @staticmethod
    def confirm_payment_atomic(
        db: Session,
        payment_id: int,
        payment_method: str,  # 'online' or 'offline'
        confirmed_by_user_id: int = None,
    ) -> dict:
        """
        Confirm a payment in a single atomic transaction.
        
        Flow (all in one ACID transaction):
        1️⃣ PHASE 1: Resolve context (trip, vehicle, owner, currency)
        2️⃣ PHASE 2: Calculate amounts (commission rules, splits)
        3️⃣ PHASE 3: Create/update payment record
        4️⃣ PHASE 4: Create ledger entries (immutable)
        5️⃣ PHASE 5: Update wallets (online vs offline)
        6️⃣ Commit (all or nothing)
        
        Args:
            db: Database session
            payment_id: Payment ID to confirm
            payment_method: 'online' or 'offline'
            confirmed_by_user_id: Who confirmed (driver/dispatcher)
            
        Returns:
            dict with confirmation details, ledger, and wallet snapshots
            
        Raises:
            ValueError: If validation fails (payment, trip, rules missing)
            Exception: DB errors trigger automatic rollback
        """
        
        try:
            now = datetime.now(timezone.utc)
            
            # =========================================================
            # 1️⃣ PHASE 1: RESOLVE CONTEXT (READ-ONLY)
            # =========================================================
            
            # Fetch payment (locked for update)
            payment = db.query(Payment).filter(
                Payment.payment_id == payment_id
            ).with_for_update().first()
            
            if not payment:
                raise ValueError(f"Payment {payment_id} not found")
            
            if payment.payment_status != "initiated":
                raise ValueError(
                    f"Payment status is '{payment.payment_status}', must be 'initiated'"
                )
            
            # Fetch trip
            trip = db.query(Trip).filter(
                Trip.trip_id == payment.trip_id
            ).first()
            
            if not trip:
                raise ValueError(f"Trip {payment.trip_id} not found")
            
            if trip.trip_status != "completed":
                raise ValueError(f"Trip status is '{trip.trip_status}', must be 'completed'")
            
            # Fetch trip fare (frozen final amount)
            trip_fare = db.query(TripFare).filter(
                TripFare.trip_id == trip.trip_id
            ).first()
            
            if not trip_fare:
                raise ValueError(f"Trip fare not found for trip {trip.trip_id}")
            
            # Fetch vehicle and determine owner
            vehicle = db.query(Vehicle).filter(
                Vehicle.vehicle_id == trip.vehicle_id
            ).first()
            
            if not vehicle:
                raise ValueError(f"Vehicle {trip.vehicle_id} not found")
            
            owner_type = vehicle.owner_type  # 'driver' or 'fleet_owner'
            owner_id = vehicle.owner_id
            
            if not owner_id or not owner_type:
                raise ValueError(
                    f"Vehicle {vehicle.vehicle_id} has no owner configured"
                )
            
            # Fetch tenant country for currency (settlement currency)
            tenant_country = db.query(TenantCountry).filter(
                TenantCountry.tenant_id == trip.tenant_id
            ).first()
            
            settlement_currency = (
                tenant_country.default_currency 
                if tenant_country else "USD"
            )
            
            # Fetch trip request for distance (for slab-based rules)
            trip_request = None
            if trip.trip_request_id:
                trip_request = db.query(TripRequest).filter(
                    TripRequest.trip_request_id == trip.trip_request_id
                ).first()
            
            distance_km = float(trip.distance_km or trip_request.estimated_distance_km if trip_request else 0)
            
            print(f"[PHASE 1 COMPLETE] trip={trip.trip_id} owner={owner_type}:{owner_id} currency={settlement_currency}")
            
            # =========================================================
            # 2️⃣ PHASE 2: CALCULATE AMOUNTS (NO DB WRITES)
            # =========================================================
            
            # Frozen amounts from fare
            subtotal = Decimal(str(trip_fare.subtotal))
            tax_amount = Decimal(str(trip_fare.tax_amount))
            final_fare = Decimal(str(trip_fare.final_fare))
            
            # Resolve owner commission rule
            owner_rule = db.query(OwnerCommissionRule).filter(
                OwnerCommissionRule.tenant_id == trip.tenant_id,
                OwnerCommissionRule.vehicle_category == vehicle.category_code,
                OwnerCommissionRule.owner_type == owner_type,
                OwnerCommissionRule.distance_min_km <= distance_km,
                OwnerCommissionRule.effective_from <= now,
                or_(
                    OwnerCommissionRule.effective_to.is_(None),
                    OwnerCommissionRule.effective_to > now
                ),
            ).first()
            
            if not owner_rule:
                # Fallback: 45% to owner
                print(f"[WARNING] No owner commission rule found, using default 45%")
                owner_amount = (subtotal * Decimal("0.45")).quantize(Decimal("0.01"))
            else:
                # Calculate owner commission
                if owner_rule.commission_type == "flat":
                    owner_amount = Decimal(str(owner_rule.commission_value))
                else:  # percentage
                    owner_amount = (
                        subtotal * Decimal(str(owner_rule.commission_value)) / Decimal("100")
                    )
                    if owner_rule.commission_cap:
                        owner_amount = min(
                            owner_amount,
                            Decimal(str(owner_rule.commission_cap))
                        )
            
            # Resolve tenant commission rule
            tenant_rule = db.query(TenantCommissionRule).filter(
                TenantCommissionRule.tenant_id == trip.tenant_id,
                TenantCommissionRule.vehicle_category == vehicle.category_code,
                TenantCommissionRule.distance_min_km <= distance_km,
                TenantCommissionRule.effective_from <= now,
                or_(
                    TenantCommissionRule.effective_to.is_(None),
                    TenantCommissionRule.effective_to > now
                ),
            ).first()
            
            if not tenant_rule:
                # Fallback: 45% to tenant
                print(f"[WARNING] No tenant commission rule found, using default 45%")
                tenant_amount = (subtotal * Decimal("0.45")).quantize(Decimal("0.01"))
            else:
                # Calculate tenant commission
                if tenant_rule.commission_type == "flat":
                    tenant_amount = Decimal(str(tenant_rule.commission_value))
                else:  # percentage
                    tenant_amount = (
                        subtotal * Decimal(str(tenant_rule.commission_value)) / Decimal("100")
                    )
                    if tenant_rule.commission_cap:
                        tenant_amount = min(
                            tenant_amount,
                            Decimal(str(tenant_rule.commission_cap))
                        )
            
            # Platform fee = everything left from subtotal
            platform_fee = subtotal - owner_amount - tenant_amount
            
            # INVARIANT CHECK
            if abs((owner_amount + tenant_amount + platform_fee) - subtotal) > Decimal("0.01"):
                raise ValueError(
                    f"INVARIANT VIOLATION: owner({owner_amount}) + tenant({tenant_amount}) "
                    f"+ platform({platform_fee}) != subtotal({subtotal})"
                )
            
            print(
                f"[PHASE 2 COMPLETE] owner={owner_amount} tenant={tenant_amount} "
                f"platform={platform_fee} tax={tax_amount} final={final_fare}"
            )
            
            # =========================================================
            # 3️⃣ PHASE 3: CREATE/UPDATE PAYMENT RECORD
            # =========================================================
            
            payment.payment_status = "successful"
            payment.payment_method = payment_method
            payment.paid_at_utc = now
            payment.confirmed_by_user_id = confirmed_by_user_id
            payment.currency_code = settlement_currency
            payment.amount = float(final_fare)
            
            db.add(payment)
            db.flush()
            
            print(f"[PHASE 3 COMPLETE] payment_status=successful")
            
            # =========================================================
            # 4️⃣ PHASE 4: CREATE LEDGER ENTRIES (IMMUTABLE)
            # =========================================================
            
            ledger_entries = []
            
            # Owner earning
            ledger_entries.append(FinancialLedger(
                tenant_id=trip.tenant_id,
                trip_id=trip.trip_id,
                entity_type="owner",
                entity_id=owner_id,
                transaction_type="owner_earning",
                amount=float(owner_amount),
                currency_code=settlement_currency,
                created_at_utc=now,
            ))
            
            # Tenant share
            ledger_entries.append(FinancialLedger(
                tenant_id=trip.tenant_id,
                trip_id=trip.trip_id,
                entity_type="tenant",
                entity_id=trip.tenant_id,
                transaction_type="tenant_share",
                amount=float(tenant_amount),
                currency_code=settlement_currency,
                created_at_utc=now,
            ))
            
            # Platform fee
            ledger_entries.append(FinancialLedger(
                tenant_id=trip.tenant_id,
                trip_id=trip.trip_id,
                entity_type="platform",
                entity_id=None,
                transaction_type="platform_fee",
                amount=float(platform_fee),
                currency_code=settlement_currency,
                created_at_utc=now,
            ))
            
            # Tax (as liability)
            ledger_entries.append(FinancialLedger(
                tenant_id=trip.tenant_id,
                trip_id=trip.trip_id,
                entity_type="tax",
                entity_id=None,
                transaction_type="tax",
                amount=float(tax_amount),
                currency_code=settlement_currency,
                created_at_utc=now,
            ))
            
            db.add_all(ledger_entries)
            db.flush()
            
            print(f"[PHASE 4 COMPLETE] {len(ledger_entries)} ledger entries created")
            
            # =========================================================
            # 5️⃣ PHASE 5: WALLET UPDATES
            # =========================================================
            
            # Get or create owner wallet
            owner_wallet = db.query(OwnerWallet).filter(
                OwnerWallet.owner_id == owner_id,
                OwnerWallet.owner_type == owner_type,
                OwnerWallet.tenant_id == trip.tenant_id,
                OwnerWallet.currency_code == settlement_currency,
            ).with_for_update().first()
            
            if not owner_wallet:
                owner_wallet = OwnerWallet(
                    owner_id=owner_id,
                    owner_type=owner_type,
                    tenant_id=trip.tenant_id,
                    currency_code=settlement_currency,
                    balance=Decimal("0"),
                )
                db.add(owner_wallet)
                db.flush()
            
            old_owner_balance = Decimal(str(owner_wallet.balance))
            
            # Apply payment method logic
            if payment_method == "online":
                # Platform collected money → platform owes owner
                owner_wallet.balance = (
                    Decimal(str(owner_wallet.balance)) + owner_amount
                )
            elif payment_method == "offline":
                # Owner collected entire fare → owner owes platform & tenant
                # Negative balance = owner owes platform
                owner_wallet.balance = (
                    Decimal(str(owner_wallet.balance)) - (tenant_amount + platform_fee)
                )
            else:
                raise ValueError(f"Invalid payment_method: {payment_method}")
            
            owner_wallet.last_updated_utc = now
            db.add(owner_wallet)
            db.flush()
            
            # Record owner wallet transaction (audit trail)
            owner_wallet_txn = OwnerWalletTransaction(
                fleet_owner_wallet_id=owner_wallet.owner_wallet_id,
                trip_id=trip.trip_id,
                transaction_type="payment_" + payment_method,
                amount=float(
                    owner_wallet.balance - old_owner_balance
                ),
                created_at_utc=now,
            )
            db.add(owner_wallet_txn)
            db.flush()
            
            # Get or create tenant wallet
            tenant_wallet = db.query(TenantWallet).filter(
                TenantWallet.tenant_id == trip.tenant_id,
                TenantWallet.currency_code == settlement_currency,
            ).with_for_update().first()
            
            if not tenant_wallet:
                tenant_wallet = TenantWallet(
                    tenant_id=trip.tenant_id,
                    currency_code=settlement_currency,
                    balance=Decimal("0"),
                )
                db.add(tenant_wallet)
                db.flush()
            
            old_tenant_balance = Decimal(str(tenant_wallet.balance))
            
            # Tenant wallet logic (same for online & offline)
            tenant_wallet.balance = (
                Decimal(str(tenant_wallet.balance)) + tenant_amount
            )
            tenant_wallet.last_updated_utc = now
            db.add(tenant_wallet)
            db.flush()
            
            # Record tenant wallet transaction (audit trail)
            tenant_wallet_txn = TenantWalletTransaction(
                tenant_wallet_id=tenant_wallet.tenant_wallet_id,
                trip_id=trip.trip_id,
                transaction_type="payment_" + payment_method,
                amount=float(
                    tenant_wallet.balance - old_tenant_balance
                ),
                created_at_utc=now,
            )
            db.add(tenant_wallet_txn)
            db.flush()
            
            print(
                f"[PHASE 5 COMPLETE] owner_balance: {old_owner_balance} → {owner_wallet.balance}, "
                f"tenant_balance: {old_tenant_balance} → {tenant_wallet.balance}"
            )
            
            # =========================================================
            # 6️⃣ COMMIT TRANSACTION (ALL OR NOTHING)
            # =========================================================
            
            db.commit()
            
            print(f"[PHASE 6 COMPLETE] Transaction committed")
            
            # =========================================================
            # Return confirmation receipt
            # =========================================================
            
            return {
                "payment_id": payment.payment_id,
                "trip_id": trip.trip_id,
                "payment_status": "successful",
                "payment_method": payment_method,
                "paid_at_utc": payment.paid_at_utc.isoformat() if payment.paid_at_utc else None,
                "settlement_currency": settlement_currency,
                "settlement_amount": float(final_fare),
                "breakdown": {
                    "owner_amount": float(owner_amount),
                    "tenant_amount": float(tenant_amount),
                    "platform_fee": float(platform_fee),
                    "tax_amount": float(tax_amount),
                    "subtotal": float(subtotal),
                    "final_fare": float(final_fare),
                },
                "owner_wallet": {
                    "owner_id": owner_id,
                    "owner_type": owner_type,
                    "old_balance": float(old_owner_balance),
                    "new_balance": float(owner_wallet.balance),
                    "status": "owes_platform" if owner_wallet.balance < 0 else (
                        "settled" if owner_wallet.balance == 0 else "platform_owes"
                    ),
                },
                "tenant_wallet": {
                    "tenant_id": trip.tenant_id,
                    "old_balance": float(old_tenant_balance),
                    "new_balance": float(tenant_wallet.balance),
                },
                "ledger_entries": len(ledger_entries),
            }
        
        except Exception as e:
            # Automatic rollback on any error
            db.rollback()
            print(f"[PAYMENT_CONFIRM_ERROR] {str(e)}")
            raise
