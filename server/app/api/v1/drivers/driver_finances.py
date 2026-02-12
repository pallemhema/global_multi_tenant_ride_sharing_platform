"""
Driver Finance Endpoints - Wallet, Ledger, and Earnings.

Endpoints:
- GET /driver/wallet: Get driver's wallet balance
- GET /driver/ledger: Get driver's ledger entries (paginated)
- GET /driver/earnings/summary: Get earnings summary
- GET /driver/trips/{trip_id}/payment: Get payment details for a trip
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.wallets.owner_wallet import OwnerWallet
from app.models.core.accounting.ledger import FinancialLedger
from app.models.core.payments.payments import Payment
from app.models.core.trips.trips import Trip
from app.models.core.drivers.drivers import Driver
from app.models.core.trips.trip_request import TripRequest


router = APIRouter(
    prefix="/driver",
    tags=["Driver – Finances"],
)


# ================================================================
# Request/Response Schemas
# ================================================================

class WalletResponse:
    """Driver's wallet balance"""
    balance: float
    currency_code: str
    owner_type: str  # 'individual' or 'fleet'
    is_offline_debt: bool  # negative balance flag
    last_updated_utc: Optional[str]







# ================================================================
# WALLET ENDPOINT
# ================================================================

@router.get("/wallet", response_model=None)
def get_driver_wallet(
    driver: Driver = Depends(require_driver),
    db: Session = Depends(get_db),
):
    """
    Get driver's current wallet balance.
    
    Returns balance in tenant's settlement currency.
    Positive balance = platform owes driver
    Negative balance = driver owes platform (offline debt)
    """
    try:
        # Get driver's wallet
        wallet = db.query(OwnerWallet).filter(
            and_(
                OwnerWallet.driver_id == driver.driver_id,
                OwnerWallet.tenant_id == driver.tenant_id,
            )
        ).first()
        
        if not wallet:
            # Return zero balance if wallet doesn't exist yet
            return {
                "balance": 0.00,
                "currency_code": wallet.currency_code if wallet else "USD",
                "owner_type": "individual",
                "is_offline_debt": False,
                "last_updated_utc": None,
            }
        
        return {
            "balance": float(wallet.balance),
            "currency_code": wallet.currency_code if wallet else "USD",
            "owner_type": wallet.owner_type if wallet else "individual",
            "is_offline_debt": float(wallet.balance) < 0 if wallet else False,
            "last_updated_utc": wallet.last_updated_utc.isoformat() if wallet and wallet.last_updated_utc else None,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch wallet: {str(e)}",
        )



def build_trip_payment_details(
    trip: Trip,
    driver: Driver,
    db: Session,
) -> dict:
    payment = db.query(Payment).filter(
        Payment.trip_id == trip.trip_id,
        Payment.tenant_id == driver.tenant_id,
    ).first()

    if not payment:
        return {
            "payment_status": "not_found"
        }

    ledger_entries = db.query(FinancialLedger).filter(
        FinancialLedger.trip_id == trip.trip_id
    ).all()

    breakdown = {
        "platform_fee": 0.0,
        "tenant_commission": 0.0,
        "tax": 0.0,
        "driver_earning": 0.0,
    }

    for entry in ledger_entries:
        amount = float(entry.amount)
        if entry.transaction_type == "platform_fee":
            breakdown["platform_fee"] += amount
        elif entry.transaction_type == "tenant_share":
            breakdown["tenant_commission"] += amount
        elif entry.transaction_type == "tax":
            breakdown["tax"] += amount
        elif entry.transaction_type == "driver_earning":
            breakdown["driver_earning"] += amount

    total_fare = sum(breakdown.values())

    return {
        "payment_id": payment.payment_id,
        "total_fare": total_fare,
        "platform_fee": breakdown["platform_fee"],
        "tenant_commission": breakdown["tenant_commission"],
        "tax": breakdown["tax"],
        "driver_earning": breakdown["driver_earning"],
        "currency_code": payment.currency_code,
        "payment_method": payment.payment_method or "pending",
        "payment_status": payment.payment_status,
    }

@router.get("/past-trips")
def get_past_trips(
    driver: Driver = Depends(require_driver),
    db: Session = Depends(get_db),
):
    """
    Get past trips for the driver with payment details.
    """
    try:
        # Get past trips (completed or cancelled)
        past_trips = db.query(Trip).filter(
            and_(
                Trip.driver_id == driver.driver_id,
                Trip.tenant_id == driver.tenant_id,
                Trip.trip_status=='completed',
            )
        ).order_by(desc(Trip.completed_at_utc)).all()
      
        trip_list = []

        for trip in past_trips:
            # Fetch trip request (address source)
            trip_request = None
            if trip.trip_request_id:
                trip_request = db.query(TripRequest).filter(
                    TripRequest.trip_request_id == trip.trip_request_id
                ).first()

            pickup_address = (
                trip_request.pickup_address
                if trip_request and trip_request.pickup_address
                else None
            )

            drop_address = (
                trip_request.drop_address
                if trip_request and trip_request.drop_address
                else None
            )

            # Payment details (already safe)
            payment_details = build_trip_payment_details(trip, driver, db)

            trip_list.append({
                "trip_id": trip.trip_id,
                "start_time": (
                    trip.picked_up_at_utc.isoformat()
                    if trip.picked_up_at_utc else None
                ),
                "end_time": (
                    trip.completed_at_utc.isoformat()
                    if trip.completed_at_utc else None
                ),
                "pickup_address": pickup_address,
                "drop_address": drop_address,
                "payment_details": payment_details,
            })



       
        return {"trips": trip_list}
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch past trips: {str(e)}",
        )