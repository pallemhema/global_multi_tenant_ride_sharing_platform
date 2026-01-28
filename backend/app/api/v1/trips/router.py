from .driver_location import router as driver_location_router
from .trip_request import router as trip_request_router
from .trip_start import router as trip_start_router
from .driver_response import router as drive_response_router

from fastapi import APIRouter

router = APIRouter()

router.include_router(driver_location_router)
router.include_router(trip_request_router)
router.include_router(trip_start_router)
router.include_router(drive_response_router)