
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import traceback
import logging

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.drivers.drivers import Driver
from app.core.payments.payment_confirmation_service import PaymentConfirmationService

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/driver/payments",
    tags=["Driver – Payments"],
)


# ================================================================
# Request/Response Schemas
# ================================================================

class PaymentConfirmationRequest(BaseModel):
    trip_id: int
    payment_method: str  # 'online' or 'offline'


class BreakdownInfo(BaseModel):
    owner_amount: float
    tenant_amount: float
    platform_fee: float
    tax_amount: float
    subtotal: float
    final_fare: float



class PaymentConfirmationResponse(BaseModel):
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
   

    try:
        result = PaymentConfirmationService.confirm_payment_atomic(
            db=db,
            trip_id=payload.trip_id,
            payment_method=payload.payment_method,
            confirmed_by_user_id=driver.driver_id,
        )

        return PaymentConfirmationResponse(**result)

    except ValueError as e:
        logger.error(f"[PaymentConfirm-ValueError] {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"[PaymentConfirm-Error] {str(e)}")
        logger.error(f"[PaymentConfirm-Traceback]\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Payment confirmation failed: {str(e)}")
