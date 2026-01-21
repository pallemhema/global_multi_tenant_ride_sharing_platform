from fastapi import APIRouter

from .on_bording import router as onboarding_router
from .vehicles import router as vehicles_router
from .vehicle_documents import router as vehicle_documents_router
from .fleet_cities import router as fleet_cities_router
from .fleet_documents import router as documents_router
from .driver_invites import router as driver_invite_router
from .vehicle_assignment import router as vehicle_assigent_to_driver_router

router = APIRouter()

router.include_router(onboarding_router)
router.include_router(vehicles_router)
router.include_router(vehicle_documents_router)
router.include_router(documents_router)
router.include_router(fleet_cities_router)
router.include_router(driver_invite_router)
router.include_router(vehicle_assigent_to_driver_router)
