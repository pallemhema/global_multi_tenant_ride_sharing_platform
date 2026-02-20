from decimal import Decimal
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.accounting.exchange_rate import FXService
from app.models.core.trips.trips import Trip
from app.models.core.payments.payments import Payment
from app.models.lookups.city import City
from app.models.lookups.country import Country
from app.models.core.tenants.tenants import Tenant
from app.models.core.accounting.ledger import FinancialLedger
from app.models.core.wallets.owner_wallet import OwnerWallet
from app.models.core.wallets.tenant_wallet import TenantWallet


class PaymentConfirmationService:

    @staticmethod
    def confirm_payment_atomic(
        db: Session,
        trip_id: int,
        payment_method: str,
        confirmed_by_user_id: int,
    ):

        now = datetime.now(timezone.utc)

        # =====================================================
        # 1️⃣ Load & Lock Trip
        # =====================================================
        trip = (
            db.query(Trip)
            .filter(Trip.trip_id == trip_id)
            .with_for_update()
            .first()
        )

        if not trip:
            raise HTTPException(404, "Trip not found")

        # =====================================================
        #  Load & Lock Payment
        # =====================================================
        payment = (
            db.query(Payment)
            .filter(Payment.trip_id == trip_id)
            .with_for_update()
            .first()
        )

        if not payment:
            raise HTTPException(404, "Payment not found")

        if payment.payment_status == "successful":
            raise HTTPException(400, "Payment already confirmed")

        # =====================================================
        #  Load Geography & Tenant
        # =====================================================
        city = db.get(City, trip.city_id)
        if not city:
            raise HTTPException(404, "City not found")

        country = db.get(Country, city.country_id)
        if not country:
            raise HTTPException(404, "Country not found")

        tenant = db.get(Tenant, trip.tenant_id)
        if not tenant:
            raise HTTPException(404, "Tenant not found")

        payment_currency = payment.currency_code
        country_currency = country.default_currency
        settlement_currency = tenant.settlement_currency_code

        # Safety check (MVP rule)
        if payment_currency != country_currency:
            raise HTTPException(400, "Invalid payment currency for country")

        # =====================================================
        #  Commission Split (Simplified MVP Example)
        # =====================================================
        total_amount = Decimal(payment.amount)

        # Example split logic (replace with your rule engine)
        owner_amount = total_amount * Decimal("0.60")
        tenant_amount = total_amount * Decimal("0.20")
        platform_net = total_amount * Decimal("0.18")
        platform_tax = total_amount * Decimal("0.02")

        owner_amount = owner_amount.quantize(Decimal("0.01"))
        tenant_amount = tenant_amount.quantize(Decimal("0.01"))
        platform_net = platform_net.quantize(Decimal("0.01"))
        platform_tax = platform_tax.quantize(Decimal("0.01"))

        # ====================================================
        #  Convert Tenant Only (
        # =====================================================
        tenant_converted = tenant_amount
        fx_rate = None

        if payment_currency != settlement_currency:
            tenant_converted, fx_rate = FXService.convert(
                db=db,
                amount=tenant_amount,
                from_currency=payment_currency,
                to_currency=settlement_currency,
            )

        # =====================================================
        #  Update Payment Status
        # =====================================================
        payment.payment_status = "successful"
        payment.payment_method = payment_method
        payment.paid_at_utc = now
        payment.confirmed_by_user_id = confirmed_by_user_id
        db.flush()

        # =====================================================
        #  Insert Ledger CREDIT Entries
        # =====================================================
        ledger_rows = [

            # Platform Fee
            FinancialLedger(
                payment_id=payment.payment_id,
                trip_id=trip.trip_id,
                tenant_id=trip.tenant_id,
                country_id=country.country_id,
                entity_type="platform",
                entity_id=None,
                transaction_type="platform_fee",
                entry_type="CREDIT",
                amount=platform_net,
                currency_code=country_currency,
                credited_at_utc=now,
            ),

            # Tax
            FinancialLedger(
                payment_id=payment.payment_id,
                trip_id=trip.trip_id,
                tenant_id=trip.tenant_id,
                country_id=country.country_id,
                entity_type="platform",
                entity_id=None,
                transaction_type="tax",
                entry_type="CREDIT",
                amount=platform_tax,
                currency_code=country_currency,
                credited_at_utc=now,
            ),

            # Owner
            FinancialLedger(
                payment_id=payment.payment_id,
                trip_id=trip.trip_id,
                tenant_id=trip.tenant_id,
                country_id=country.country_id,
                entity_type="owner",
                entity_id=trip.driver_id,
                transaction_type="driver_earning",
                entry_type="CREDIT",
                amount=owner_amount,
                currency_code=country_currency,
                credited_at_utc=now,
            ),

            # Tenant
            FinancialLedger(
                payment_id=payment.payment_id,
                trip_id=trip.trip_id,
                tenant_id=trip.tenant_id,
                country_id=country.country_id,
                entity_type="tenant",
                entity_id=trip.tenant_id,
                transaction_type="tenant_share",
                entry_type="CREDIT",
                amount=tenant_converted,
                currency_code=settlement_currency,
                credited_at_utc=now,
                original_amount=tenant_amount if fx_rate else None,
                original_currency=payment_currency if fx_rate else None,
                exchange_rate_used=fx_rate,
            ),
        ]

        db.add_all(ledger_rows)
        db.flush()

        # =====================================================
        #  Update Owner Wallet
        # =====================================================
        owner_wallet = (
            db.query(OwnerWallet)
            .filter(
                OwnerWallet.driver_id == trip.driver_id,
                OwnerWallet.tenant_id == trip.tenant_id,
                OwnerWallet.currency_code == country_currency,
            )
            .with_for_update()
            .first()
        )

        if not owner_wallet:
            owner_wallet = OwnerWallet(
                owner_type="driver",
                driver_id=trip.driver_id,
                tenant_id=trip.tenant_id,
                currency_code=country_currency,
                balance=Decimal("0.00"),
            )
            db.add(owner_wallet)
            db.flush()

        owner_wallet.balance += owner_amount
        owner_wallet.last_updated_utc = now

        # =====================================================
        #  Update Tenant Wallet
        # =====================================================
        tenant_wallet = (
            db.query(TenantWallet)
            .filter(
                TenantWallet.tenant_id == trip.tenant_id,
                TenantWallet.currency_code == settlement_currency,
            )
            .with_for_update()
            .first()
        )

        if not tenant_wallet:
            tenant_wallet = TenantWallet(
                tenant_id=trip.tenant_id,
                currency_code=settlement_currency,
                balance=Decimal("0.00"),
            )
            db.add(tenant_wallet)
            db.flush()

        tenant_wallet.balance += tenant_converted
        tenant_wallet.last_updated_utc = now

    
        db.commit()

        return {
            "payment_id": payment.payment_id,
            "trip_id": trip.trip_id,
            "payment_status": payment.payment_status,
            "payment_method": payment_method,
            "paid_at_utc": payment.paid_at_utc.isoformat(),

            # 🔹 Payment Info
            "payment_currency": payment_currency,
            "payment_amount": float(total_amount),

            # 🔹 Tenant Settlement Info
            "tenant_settlement_currency": settlement_currency,
            "tenant_settlement_amount": float(tenant_converted),

            # 🔹 Breakdown (original split before conversion)
            "breakdown": {
                "owner_amount": float(owner_amount),
                "tenant_amount_original": float(tenant_amount),
                "platform_fee": float(platform_net),
                "tax_amount": float(platform_tax),
                
                "final_fare": float(total_amount),
            },

            # 🔹 Wallet Balances After Update
            "owner_wallet_balance": float(owner_wallet.balance),
            "owner_wallet_currency": country_currency,

            "tenant_wallet_balance": float(tenant_wallet.balance),
            "tenant_wallet_currency": settlement_currency,

            # 🔹 Audit Info
            "ledger_entries_count": 4,
        }

