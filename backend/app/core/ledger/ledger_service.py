"""
Ledger Service - Step 13 & 14 of Trip Lifecycle

Creates immutable ledger entries for financial settlement.
All wallet balances derived from ledger, never computed directly.
"""

from decimal import Decimal
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.core.trips.trips import Trip


class LedgerService:
    """
    Create immutable ledger entries for settlement.
    """

    @staticmethod
    def create_settlement_entries(
        db: Session,
        trip: Trip,
        total_fare: Decimal | float,
        coupon_discount: Decimal | float = Decimal("0"),
        now: datetime | None = None,
    ) -> list:
        """
        Create settlement ledger entries after trip completion.
        
        Entries created:
        1. Trip revenue
        2. Platform fee
        3. Driver earnings
        4. Tax entry (if applicable)
        5. Coupon discount (if applicable)
        """
        if now is None:
            now = datetime.now(timezone.utc)
        
        from app.models.core.accounting.ledger import FinancialLedger
        
        total_fare = Decimal(str(total_fare))
        coupon_discount = Decimal(str(coupon_discount))
        
        # Calculate splits
        # Platform typically takes 20% of fare
        platform_fee = total_fare * Decimal("0.20")
        driver_earnings = total_fare - platform_fee
        
        # Tax is ~5% of final amount (can vary by region)
        tax_rate = Decimal("0.05")  # 5% default
        tax_amount = total_fare * tax_rate
        
        entries = []
        
        # Entry 1: Trip revenue
        entries.append(
            FinancialLedger(
                tenant_id=trip.tenant_id,
                entity_type="trip",
                entity_id=trip.trip_id,
                entity_sub_type="revenue",
                amount=total_fare,
                currency_code="INR",
                description=f"Trip {trip.trip_id} fare from rider",
                created_at_utc=now,
            )
        )
        
        # Entry 2: Platform fee
        entries.append(
            FinancialLedger(
                tenant_id=trip.tenant_id,
                entity_type="trip",
                entity_id=trip.trip_id,
                entity_sub_type="platform_fee",
                amount=platform_fee,
                currency_code="INR",
                description=f"Platform fee for trip {trip.trip_id} (20%)",
                created_at_utc=now,
            )
        )
        
        # Entry 3: Driver earnings
        entries.append(
            FinancialLedger(
                tenant_id=trip.tenant_id,
                entity_type="driver",
                entity_id=trip.driver_id,
                entity_sub_type="earnings",
                amount=driver_earnings,
                currency_code="INR",
                description=f"Driver earnings from trip {trip.trip_id}",
                created_at_utc=now,
            )
        )
        
        # Entry 4: Tax
        if tax_amount > 0:
            entries.append(
                FinancialLedger(
                    tenant_id=trip.tenant_id,
                    entity_type="trip",
                    entity_id=trip.trip_id,
                    entity_sub_type="tax",
                    amount=tax_amount,
                    currency_code="INR",
                    description=f"GST/Tax for trip {trip.trip_id} (5%)",
                    created_at_utc=now,
                )
            )
        
        # Entry 5: Coupon discount (if applied)
        if coupon_discount > 0:
            entries.append(
                FinancialLedger(
                    tenant_id=trip.tenant_id,
                    entity_type="coupon",
                    entity_id=0,  # No specific coupon ID here
                    entity_sub_type="discount",
                    amount=-coupon_discount,  # Negative for debit
                    currency_code="INR",
                    description=f"Coupon discount applied to trip {trip.trip_id}",
                    created_at_utc=now,
                )
            )
        
        # Persist all entries
        db.add_all(entries)
        db.flush()
        
        return entries

    @staticmethod
    def create_cancellation_entries(
        db: Session,
        trip: Trip,
        cancellation_fee: Decimal | float,
        cancelled_by: str,  # "rider" | "driver" | "system"
        now: datetime | None = None,
    ):
        """
        Create ledger entries for cancellation fee.
        
        Cancellation fee applied when:
        - Rider cancels after driver assigned
        - Driver cancels after pickup
        """
        if now is None:
            now = datetime.now(timezone.utc)
        
        from app.models.core.accounting.ledger import FinancialLedger
        
        cancellation_fee = Decimal(str(cancellation_fee))
        
        if cancellation_fee <= 0:
            return
        
        entries = []
        
        # Cancellation fee charged to rider
        entries.append(
            FinancialLedger(
                tenant_id=trip.tenant_id,
                entity_type="trip",
                entity_id=trip.trip_id,
                entity_sub_type="cancellation_fee",
                amount=cancellation_fee,
                currency_code="INR",
                description=f"Cancellation fee - {cancelled_by} cancelled trip {trip.trip_id}",
                created_at_utc=now,
            )
        )
        
        # Fee goes to driver (if driver didn't cancel)
        if cancelled_by != "driver":
            entries.append(
                FinancialLedger(
                    tenant_id=trip.tenant_id,
                    entity_type="driver",
                    entity_id=trip.driver_id,
                    entity_sub_type="cancellation_compensation",
                    amount=cancellation_fee,
                    currency_code="INR",
                    description=f"Cancellation compensation for trip {trip.trip_id}",
                    created_at_utc=now,
                )
            )
        
        db.add_all(entries)
        db.flush()

    @staticmethod
    def get_wallet_balance(
        db: Session,
        tenant_id: int,
        entity_type: str,  # "driver" | "rider"
        entity_id: int,
    ) -> Decimal:
        """
        Calculate wallet balance from immutable ledger.
        
        Sum all ledger entries for this entity.
        """
        from app.models.core.accounting.ledger import FinancialLedger
        
        from sqlalchemy import func
        
        balance = db.query(
            func.sum(FinancialLedger.amount)
        ).filter(
            FinancialLedger.tenant_id == tenant_id,
            FinancialLedger.entity_type == entity_type,
            FinancialLedger.entity_id == entity_id,
        ).scalar() or Decimal("0")
        
        return Decimal(str(balance))
