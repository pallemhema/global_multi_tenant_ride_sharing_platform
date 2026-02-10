from .calculate import router as calculate_router
from .create_payout_batch import router as create_payout_batch_router
from .pay import router as pay_router
from fastapi import APIRouter

router = APIRouter(prefix="/app-admin")

router.include_router(create_payout_batch_router)
router.include_router(calculate_router)
router.include_router(pay_router)