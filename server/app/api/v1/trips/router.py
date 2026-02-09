from .driver_location import router as driver_location_router
from .trip_request import router as trip_request_router
from .trip_start import router as trip_start_router
from .driver_response import router as drive_response_router
from .trip_complete import router as trip_complete_router
from .trip_rating import router as trip_rating_router
from .trip_cancellation import router as trip_cancellation_router

from fastapi import APIRouter

router = APIRouter()

router.include_router(driver_location_router)
router.include_router(trip_request_router)
router.include_router(trip_start_router)
router.include_router(drive_response_router)
router.include_router(trip_complete_router)
router.include_router(trip_rating_router)
router.include_router(trip_cancellation_router)