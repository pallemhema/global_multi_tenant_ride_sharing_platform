
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import traceback
import logging

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.drivers.drivers import Driver
from app.core.payments.payment_confirmation_service import PaymentConfirmationService
from app.schemas.core.payments.payments import PaymentConfirmationRequest, PaymentConfirmationResponse,BreakdownInfo


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/trips/driver/payments",
    tags=["Driver – Payments"],
)



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
