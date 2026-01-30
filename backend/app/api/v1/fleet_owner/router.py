from fastapi import APIRouter

from .on_bording import router as onboarding_router
from .dashboard import router as dashboard_router
from .fleet_cities import router as fleet_cities_router
from .fleet_documents import router as documents_router
from .driver_invites import router as driver_invite_router
from .vehicle_assignment import router as vehicle_assigent_to_driver_router
from .fleets import router as fleet_router

router = APIRouter(prefix="/fleet-owner")

router.include_router(onboarding_router)
router.include_router(dashboard_router)
router.include_router(documents_router)
router.include_router(fleet_cities_router)
router.include_router(driver_invite_router)
router.include_router(vehicle_assigent_to_driver_router)
router.include_router(fleet_router)
