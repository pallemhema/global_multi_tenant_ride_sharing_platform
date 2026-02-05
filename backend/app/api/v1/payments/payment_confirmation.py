"""
Payment Confirmation Endpoint - marks payment as successful and triggers ledger/wallet updates.

This endpoint is called after:
1. Trip is completed (payment intent created)
2. Driver or system selects payment method (online/offline)
3. For online: payment gateway approves
4. For offline: driver confirms cash collected

Result: Ledger entries created, wallets updated, settlement initiated.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.drivers.drivers import Driver
from app.core.payments.payment_confirmation_service import PaymentConfirmationService


router = APIRouter(
    prefix="/driver/payments",
    tags=["Driver – Payments"],
)


# ================================================================
# Request/Response Schemas
# ================================================================

class PaymentConfirmationRequest(BaseModel):
    """Confirm a payment with chosen method"""
    payment_id: int
    payment_method: str  # 'online' or 'offline'


class BreakdownInfo(BaseModel):
    """Fare breakdown in settlement currency"""
    platform_fee: float
    tenant_share: float
    owner_earning: float


class PaymentConfirmationResponse(BaseModel):
    """Successful payment confirmation"""
    payment_id: int
    trip_id: int
    payment_status: str
    payment_method: str
    paid_at_utc: Optional[str]
    settlement_currency: str
    settlement_amount: float
    breakdown: BreakdownInfo
    owner_wallet_balance: float
    tenant_wallet_balance: float
    ledger_entries_count: int
    message: str


# ================================================================
# PAYMENT CONFIRMATION
# ================================================================

@router.post("/confirm", response_model=PaymentConfirmationResponse, status_code=status.HTTP_200_OK)
def confirm_payment(
    payload: PaymentConfirmationRequest,
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
):
    """
    Confirm a payment (initiated → successful).
    
    Prerequisites:
    - Trip must be completed
    - Payment must be initiated (waiting for confirmation)
    - Driver selecting payment method
    
    This endpoint:
    1. Validates payment exists and is in "initiated" status
    2. Determines financial owner (individual driver or fleet owner) from vehicle
    3. Gets tenant's settlement currency (base currency)
    4. Creates immutable ledger entries in settlement currency
    5. Updates owner and tenant wallets based on payment method:
       - Online: platform owes owner
       - Offline: owner owes platform & tenant (collected cash)
    6. Returns payment confirmation with wallet snapshots
    
    Args:
        payload: { payment_id, payment_method }
        driver: authenticated driver
        db: database session
        
    Returns:
        PaymentConfirmationResponse with wallet and ledger info
    """
    try:
        result = PaymentConfirmationService.confirm_payment_atomic(
            db=db,
            payment_id=payload.payment_id,
            payment_method=payload.payment_method,
            confirmed_by_user_id=driver.driver_id,
        )
        
        return PaymentConfirmationResponse(
            payment_id=result["payment_id"],
            trip_id=result["trip_id"],
            payment_status=result["payment_status"],
            payment_method=result["payment_method"],
            paid_at_utc=result["paid_at_utc"],
            settlement_currency=result["settlement_currency"],
            settlement_amount=result["settlement_amount"],
            breakdown=BreakdownInfo(**result["breakdown"]),
            owner_wallet_balance=result["owner_wallet_balance"],
            tenant_wallet_balance=result["tenant_wallet_balance"],
            ledger_entries_count=result["ledger_entries_count"],
            message=f"Payment {payload.payment_id} confirmed ({payload.payment_method}). Ledger entries created. Wallets updated.",
        )
    
    except ValueError as e:
        # Validation error: payment not found, invalid status, etc.
        print(f"[PAYMENT_CONFIRM_ERROR] {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    except Exception as e:
        # Unexpected error
        print(f"[PAYMENT_CONFIRM_CRITICAL] {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment confirmation failed",
        )
