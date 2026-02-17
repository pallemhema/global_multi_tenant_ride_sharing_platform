from .calculate import router as calculate_router
from .payouts import router as payouts_create_router
from .pay import router as pay_router
from fastapi import APIRouter

router = APIRouter(prefix="/app-admin")
router.include_router(payouts_create_router)
router.include_router(calculate_router)
router.include_router(pay_router)