from fastapi import APIRouter

from .on_boarding import router as onboarding_router

from .accept_invite import router as driver_invite_accept_router
from .documents import router as documents_router
from .driver_shifts import router as driver_shifs_router

router = APIRouter()

router.include_router(onboarding_router)

router.include_router(documents_router)
router.include_router(driver_invite_accept_router)
router.include_router(driver_shifs_router)