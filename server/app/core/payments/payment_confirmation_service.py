from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_
import logging
import traceback

from app.models.lookups.city import City
from app.models.core.payments.payments import Payment
from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_fare import TripFare
from app.models.core.trips.trip_request import TripRequest
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.accounting.ledger import FinancialLedger
from app.models.core.wallets.owner_wallet import OwnerWallet
from app.models.core.wallets.tenant_wallet import TenantWallet
from app.models.core.commissions.owner_commision_rules import OwnerCommissionRule
from app.models.core.commissions.tenant_commmision_rules import TenantCommissionRule

logger = logging.getLogger(__name__)


class PaymentConfirmationService:

    @staticmethod
    def confirm_payment_atomic(
        db: Session,
        trip_id: int,
        payment_method: str,   # "online" | "offline"
        confirmed_by_user_id: int,
    ) -> dict:

        try:
            now = datetime.now(timezone.utc)

            # =====================================================
            # 1️⃣ FETCH + LOCK PAYMENT
            # =====================================================
            payment = (
                db.query(Payment)
                .filter(Payment.trip_id == trip_id)
                .with_for_update()
                .first()
            )

            if not payment:
                raise ValueError("Payment not found for trip")

            if payment.payment_status == "successful":
                # Idempotent response: Fetch latest wallets and return complete response
                trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
                trip_fare = db.query(TripFare).filter(TripFare.trip_id == trip_id).first()
                
                owner_wallet = (
                    db.query(OwnerWallet)
                    .filter(
                        OwnerWallet.tenant_id == trip.tenant_id,
                    )
                    .first()
                )
                
                tenant_wallet = (
                    db.query(TenantWallet)
                    .filter(
                        TenantWallet.tenant_id == trip.tenant_id,
                    )
                    .first()
                )
                
                return {
                    "payment_id": payment.payment_id,
                    "trip_id": trip_id,
                    "payment_status": "successful",
                    "payment_method": payment.payment_method or "online",
                    "paid_at_utc": payment.paid_at_utc.isoformat() if payment.paid_at_utc else None,
                    "settlement_currency": payment.currency_code,
                    "settlement_amount": float(payment.amount or 0),
                    "breakdown": {
                        "owner_amount": 0.0,
                        "tenant_amount": 0.0,
                        "platform_fee": 0.0,
                        "tax_amount": 0.0,
                        "subtotal": float(trip_fare.subtotal) if trip_fare else 0.0,
                        "final_fare": float(trip_fare.final_fare) if trip_fare else 0.0,
                    },
                    "owner_wallet_balance": float(owner_wallet.balance) if owner_wallet else 0.0,
                    "tenant_wallet_balance": float(tenant_wallet.balance) if tenant_wallet else 0.0,
                    "ledger_entries_count": 4,
                    "message": "Payment already confirmed (idempotent)",
                }

            if payment.payment_status != "initiated":
                raise ValueError("Payment not in initiated state")

            # =====================================================
            # 2️⃣ FETCH TRIP + FARE
            # =====================================================
            trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
            if not trip or trip.trip_status != "completed":
                raise ValueError("Trip not completed")

            trip_fare = db.query(TripFare).filter(
                TripFare.trip_id == trip_id
            ).first()

            if not trip_fare:
                raise ValueError("Trip fare missing")

            final_fare = Decimal(str(trip_fare.final_fare))
            subtotal = Decimal(str(trip_fare.subtotal))
            tax_amount = Decimal(str(trip_fare.tax_amount))

            # =====================================================
            # 3️⃣ COUNTRY (FOR LEDGER)
            # =====================================================
            city = db.query(City).filter(
                City.city_id == trip.city_id
            ).first()

            if not city:
                raise ValueError("City not found")

            country_id = city.country_id

            # =====================================================
            # 4️⃣ VEHICLE + OWNER
            # =====================================================
            vehicle = db.query(Vehicle).filter(
                Vehicle.vehicle_id == trip.vehicle_id
            ).first()

            if not vehicle:
                raise ValueError("Vehicle not found")

            owner_type = vehicle.owner_type
            if owner_type == "driver":
                owner_id = vehicle.driver_owner_id
                transactionType="driver_earning"
            else:
                owner_id = vehicle.fleet_owner_id
                transactionType="fleet_earningS"


         

            # =====================================================
            # 5️⃣ DISTANCE
            # =====================================================
            trip_request = None
            if trip.trip_request_id:
                trip_request = db.query(TripRequest).filter(
                    TripRequest.trip_request_id == trip.trip_request_id
                ).first()

            distance_km = float(
                trip.distance_km
                if trip.distance_km is not None
                else (trip_request.estimated_distance_km if trip_request else 0)
            )

            # =====================================================
            # 6️⃣ PLATFORM COMMISSION (FIRST)
            # =====================================================
            tenant_rule = (
                db.query(TenantCommissionRule)
                .filter(
                    TenantCommissionRule.tenant_id == trip.tenant_id,
                    TenantCommissionRule.vehicle_category == vehicle.category_code,
                    TenantCommissionRule.min_distance_km <= distance_km,
                    or_(
                        TenantCommissionRule.max_distance_km.is_(None),
                        TenantCommissionRule.max_distance_km > distance_km,
                    ),
                    TenantCommissionRule.effective_from <= now,
                    or_(
                        TenantCommissionRule.effective_to.is_(None),
                        TenantCommissionRule.effective_to > now,
                    ),
                )
                .order_by(TenantCommissionRule.min_distance_km.desc())
                .first()
            )

            if not tenant_rule:
                raise ValueError("Tenant commission rule missing")

            # Log tenant rule
            logger.info(f"[PaymentConfirm] Tenant Rule: type={tenant_rule.tenant_fee_type}, value={tenant_rule.tenant_fee_value}")

            if tenant_rule.tenant_fee_type == "percentage":
                platform_gross = (
                    final_fare
                    * Decimal(str(tenant_rule.tenant_fee_value))
                    / Decimal("100")
                )
            else:
                platform_gross = Decimal(str(tenant_rule.tenant_fee_value))

            platform_gross = platform_gross.quantize(Decimal("0.01"))
            
            # Validate platform commission doesn't exceed final fare (max 80%)
            max_platform = final_fare * Decimal("0.80")
            if platform_gross > max_platform:
                logger.warning(
                    f"[PaymentConfirm] Platform commission {platform_gross} exceeds 80% cap of {max_platform}. "
                    f"Capping to {max_platform}"
                )
                platform_gross = max_platform

            # =====================================================
            # 7️⃣ TAX (ONLY ON PLATFORM)
            # =====================================================
            platform_tax = tax_amount
            platform_net = platform_gross - platform_tax

            # =====================================================
            # 8️⃣ DISTRIBUTABLE POOL
            # =====================================================
            distributable_amount = final_fare - platform_gross
            if distributable_amount < 0:
                raise ValueError("Platform commission exceeds fare")
            
            logger.info(
                f"[PaymentConfirm] Amounts: final_fare={final_fare}, platform_gross={platform_gross}, "
                f"distributable_amount={distributable_amount}"
            )

            # =====================================================
            # 9️⃣ OWNER SHARE
            # =====================================================
            owner_rule = (
                db.query(OwnerCommissionRule)
                .filter(
                    OwnerCommissionRule.tenant_id == trip.tenant_id,
                    OwnerCommissionRule.vehicle_category == vehicle.category_code,
                    OwnerCommissionRule.owner_type == owner_type,
                    OwnerCommissionRule.min_distance_km <= distance_km,
                    or_(
                        OwnerCommissionRule.max_distance_km.is_(None),
                        OwnerCommissionRule.max_distance_km > distance_km,
                    ),
                    OwnerCommissionRule.effective_from <= now,
                    or_(
                        OwnerCommissionRule.effective_to.is_(None),
                        OwnerCommissionRule.effective_to > now,
                    ),
                )
                .order_by(OwnerCommissionRule.min_distance_km.desc())
                .first()
            )

            if not owner_rule:
                raise ValueError("Owner commission rule missing")

            # Log owner rule
            logger.info(
                f"[PaymentConfirm] Owner Rule: type={owner_rule.owner_fee_type}, "
                f"value={owner_rule.owner_fee_value}, cap={owner_rule.owner_fee_cap}"
            )

            if owner_rule.owner_fee_type == "percentage":
                owner_amount = (
                    distributable_amount
                    * Decimal(str(owner_rule.owner_fee_value))
                    / Decimal("100")
                )
            else:
                owner_amount = Decimal(str(owner_rule.owner_fee_value))
                # For flat-rate: cap at 80% of distributable (safety check for oversized flat fees)
                max_flat = distributable_amount * Decimal("0.80")
                if owner_amount > max_flat:
                    logger.warning(
                        f"[PaymentConfirm] Flat owner fee {owner_amount} exceeds 80% cap of {max_flat}. "
                        f"Capping to {max_flat}. Fix: Delete invalid flat-rate rules (IDs: 12,10,7,5,3,1)"
                    )
                    owner_amount = max_flat

            # Validate percentage is not > 100%
            if owner_rule.owner_fee_type == "percentage" and owner_rule.owner_fee_value > 100:
                logger.warning(
                    f"[PaymentConfirm] Owner fee percentage {owner_rule.owner_fee_value}% exceeds 100%. "
                    f"Capping to 100%"
                )
                owner_amount = distributable_amount
            
            # Cap to not exceed distributable amount
            owner_amount = min(owner_amount, distributable_amount)

            if owner_rule.owner_fee_cap:
                owner_amount = min(
                    owner_amount,
                    Decimal(str(owner_rule.owner_fee_cap))
                )

            owner_amount = owner_amount.quantize(Decimal("0.01"))
            
            logger.info(f"[PaymentConfirm] Owner amount calculated: {owner_amount}")

            # =====================================================
            # 🔟 TENANT SHARE (REMAINDER)
            # =====================================================
            tenant_amount = distributable_amount - owner_amount
            if tenant_amount < 0:
                raise ValueError("Owner share exceeds distributable amount")

            tenant_amount = tenant_amount.quantize(Decimal("0.01"))
            
            logger.info(
                f"[PaymentConfirm] Final amounts: owner={owner_amount}, tenant={tenant_amount}, "
                f"platform={platform_gross}, sum={owner_amount + tenant_amount + platform_gross}"
            )

            # =====================================================
            # 11️⃣ UPDATE PAYMENT
            # =====================================================
            payment.payment_status = "successful"
            payment.payment_method = payment_method
            payment.paid_at_utc = now
            payment.confirmed_by_user_id = confirmed_by_user_id
            payment.amount = final_fare

            db.add(payment)
            db.flush()

            # =====================================================
            # 12️⃣ LEDGER (ALL POSITIVE)
            # =====================================================

            ledgers = [
                FinancialLedger(
                    payment_id=payment.payment_id,
                    trip_id=trip.trip_id,
                    tenant_id=trip.tenant_id,
                    country_id=country_id,
                    entity_type="platform",
                    entity_id=None,
                    transaction_type="platform_fee",
                    entry_type="CREDIT",
                    amount=float(platform_net),
                    currency_code=payment.currency_code,
                    credited_at_utc=now,
                ),
                FinancialLedger(
                    payment_id=payment.payment_id,
                    trip_id=trip.trip_id,
                    tenant_id=trip.tenant_id,
                    country_id=country_id,
                    entity_type="platform",
                    entity_id=None,
                    transaction_type="tax",
                    entry_type="CREDIT",
                    amount=float(platform_tax),
                    currency_code=payment.currency_code,
                    credited_at_utc=now,
                ),
                FinancialLedger(
                    payment_id=payment.payment_id,
                    trip_id=trip.trip_id,
                    tenant_id=trip.tenant_id,
                    country_id=country_id,
                    entity_type="owner",
                    entity_id=owner_id,
                    transaction_type=transactionType,
                    entry_type="CREDIT",
                    amount=float(owner_amount),
                    currency_code=payment.currency_code,
                    credited_at_utc=now,
                ),
                FinancialLedger(
                    payment_id=payment.payment_id,
                    trip_id=trip.trip_id,
                    tenant_id=trip.tenant_id,
                    country_id=country_id,
                    entity_type="tenant",
                    entity_id=trip.tenant_id,
                    transaction_type="tenant_share",
                    entry_type="CREDIT",
                    amount=float(tenant_amount),
                    currency_code=payment.currency_code,
                    credited_at_utc=now,
                ),
            ]

            db.add_all(ledgers)
            db.flush()

            # =====================================================
            # 13️⃣ WALLETS
            # =====================================================
            # Build filter based on owner_type
            if owner_type == "driver":
                owner_wallet = (
                    db.query(OwnerWallet)
                    .filter(
                        OwnerWallet.driver_id == owner_id,
                        OwnerWallet.owner_type == owner_type,
                        OwnerWallet.tenant_id == trip.tenant_id,
                        OwnerWallet.currency_code == payment.currency_code,
                    )
                    .with_for_update()
                    .first()
                )
            else:
                owner_wallet = (
                    db.query(OwnerWallet)
                    .filter(
                        OwnerWallet.fleet_owner_id == owner_id,
                        OwnerWallet.owner_type == owner_type,
                        OwnerWallet.tenant_id == trip.tenant_id,
                        OwnerWallet.currency_code == payment.currency_code,
                    )
                    .with_for_update()
                    .first()
                )

            if not owner_wallet:
                # Create wallet with correct fields based on owner_type
                # Check constraint chk_owner_exclusive: only one of driver_id or fleet_owner_id should be non-null
                if owner_type == "driver":
                    owner_wallet = OwnerWallet(
                        owner_type=owner_type,
                        driver_id=owner_id,
                        fleet_owner_id=None,
                        tenant_id=trip.tenant_id,
                        currency_code=payment.currency_code,
                        balance=owner_amount,
                    )
                else:
                    owner_wallet = OwnerWallet(
                        owner_type=owner_type,
                        fleet_owner_id=owner_id,
                        driver_id=None,
                        tenant_id=trip.tenant_id,
                        currency_code=payment.currency_code,
                        balance=owner_amount,
                    )
                
                db.add(owner_wallet)
                db.flush()

      
            tenant_wallet = (
                db.query(TenantWallet)
                .filter(
                    TenantWallet.tenant_id == trip.tenant_id,
                    TenantWallet.currency_code == payment.currency_code,
                )
                .with_for_update()
                .first()
            )

            if not tenant_wallet:
                tenant_wallet = TenantWallet(
                    tenant_id=trip.tenant_id,
                    currency_code=payment.currency_code,
                    balance=Decimal("0"),
                )
                db.add(tenant_wallet)
                db.flush()

            tenant_wallet.balance += tenant_amount

            db.commit()

            return {
                "payment_id": payment.payment_id,
                "trip_id": trip.trip_id,
                "payment_status": "successful",
                "payment_method": payment_method,
                "paid_at_utc": payment.paid_at_utc.isoformat(),
                "settlement_currency": payment.currency_code,
                "settlement_amount": float(final_fare),
                "breakdown": {
                    "owner_amount": float(owner_amount),
                    "tenant_amount": float(tenant_amount),
                    "platform_fee": float(platform_net),
                    "tax_amount": float(platform_tax),
                    "subtotal": float(subtotal),
                    "final_fare": float(final_fare),
                },
                "owner_wallet_balance": float(owner_wallet.balance),
                "tenant_wallet_balance": float(tenant_wallet.balance),
                "ledger_entries_count": 4,
                "message": "Payment confirmed successfully",
            }

        except Exception as e:
            logger.error(f"[PaymentConfirm] {str(e)}")
            logger.error(traceback.format_exc())
            db.rollback()
            raise
