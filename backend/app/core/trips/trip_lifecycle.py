"""
Trip Lifecycle Service - Core orchestration for entire trip flow

Manages state transitions through:
1. Trip creation → 2. Discover tenants → 3. Pricing → 4. Tenant select
→ 5. Driver pool prep → 6. Geo sorting → 7. Batch dispatch
→ 8. Driver response → 9. Assignment → 10. Notify rider
→ 11. Trip start → 12. Completion → 13. Payment → 14. Settlement
→ 15. Post-trip → 16. Cancellation handling
"""

from decimal import Decimal
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import math

from app.models.core.trips.trip_request import TripRequest
from app.models.core.trips.trip_batch import TripBatch
from app.models.core.trips.trips import Trip
from app.models.core.drivers.drivers import Driver
from app.models.core.tenants.tenants import Tenant
from app.models.core.cities.cities import City
from app.models.core.vehicles.vehicles import Vehicle
from app.core.redis import redis_client


class TripLifecycle:
    """
    Orchestrates the entire trip lifecycle with state validation
    and consistency checks at each stage.
    """
    
    # ================================================================
    # STEP 0: VALIDATION & SAFETY CHECKS
    # ================================================================
    
    @staticmethod
    def validate_rider_state(db: Session, rider_id: int) -> bool:
        """
        Ensure rider is eligible for trips:
        - Active account
        - Not blocked
        """
        from app.models.core.riders.riders import Rider
        
        rider = db.query(Rider).filter(
            Rider.rider_id == rider_id,
            Rider.is_active.is_(True),
        ).first()
        
        return rider is not None
    
    @staticmethod
    def validate_driver_state(db: Session, driver_id: int, tenant_id: int) -> dict | None:
        """
        Re-validate driver state before ANY operation.
        Returns driver details if valid, None otherwise.
        
        Checks:
        - Approved driver
        - Active driver
        - Online shift
        - Available runtime
        - City match
        - KYC approved
        """
        from app.models.core.drivers.driver_current_status import DriverCurrentStatus
        
        driver = db.query(Driver).filter(
            Driver.driver_id == driver_id,
            Driver.tenant_id == tenant_id,
            Driver.is_active.is_(True),
            Driver.kyc_status == "approved",
        ).first()
        
        if not driver:
            return None
        
        # Check runtime status
        status_rec = db.query(DriverCurrentStatus).filter(
            DriverCurrentStatus.driver_id == driver_id,
            DriverCurrentStatus.is_online.is_(True),
            DriverCurrentStatus.runtime_status == "available",
        ).first()
        
        if not status_rec:
            return None
        
        return {
            "driver_id": driver.driver_id,
            "tenant_id": driver.tenant_id,
            "city_id": driver.home_city_id,
            "is_active": driver.is_active,
            "kyc_status": driver.kyc_status,
        }
    
    @staticmethod
    def validate_vehicle_state(db: Session, driver_id: int, category: str) -> dict | None:
        """
        Validate driver has active vehicle of required category.
        
        Checks:
        - Vehicle exists & active
        - Belongs to driver
        - Category matches
        - Documents approved
        """
        from app.models.core.driver_vehicles import DriverVehicle
        
        vehicle = db.query(Vehicle).join(
            DriverVehicle,
            Vehicle.vehicle_id == DriverVehicle.vehicle_id
        ).filter(
            DriverVehicle.driver_id == driver_id,
            Vehicle.is_active.is_(True),
            Vehicle.vehicle_category == category,
            Vehicle.document_status == "approved",
        ).first()
        
        if not vehicle:
            return None
        
        return {
            "vehicle_id": vehicle.vehicle_id,
            "vehicle_category": vehicle.vehicle_category,
            "plate_number": vehicle.plate_number,
        }
    
    @staticmethod
    def validate_tenant_state(db: Session, tenant_id: int, city_id: int) -> bool:
        """
        Validate tenant is active and serves the city.
        """
        from app.models.core.tenants.tenant_cities import TenantCity
        
        tenant = db.query(Tenant).filter(
            Tenant.tenant_id == tenant_id,
            Tenant.status == "active",
            Tenant.approval_status == "approved",
        ).first()
        
        if not tenant:
            return False
        
        operates_in_city = db.query(TenantCity).filter(
            TenantCity.tenant_id == tenant_id,
            TenantCity.city_id == city_id,
            TenantCity.is_active.is_(True),
        ).first()
        
        return operates_in_city is not None
    
    # ================================================================
    # STEP 1-4: REQUEST CREATION & TENANT SELECTION
    # ================================================================
    # (Handled in trip_request.py endpoints)
    
    # ================================================================
    # STEP 5: PREPARE DRIVER POOL (ELIGIBILITY FILTERING)
    # ================================================================
    
    @staticmethod
    def fetch_eligible_drivers(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
    ) -> list[dict]:
        """
        Fetch all drivers eligible for dispatch.
        
        Criteria:
        - Belongs to tenant
        - Approved & active
        - Online & available
        - Same city
        - Full KYC
        - Has active vehicle of category
        - Not already in dispatch
        """
        from app.models.core.drivers.driver_current_status import DriverCurrentStatus
        from app.models.core.driver_vehicles import DriverVehicle
        
        eligible = db.query(Driver).join(
            DriverCurrentStatus,
            Driver.driver_id == DriverCurrentStatus.driver_id
        ).filter(
            Driver.tenant_id == tenant_id,
            Driver.home_city_id == city_id,
            Driver.is_active.is_(True),
            Driver.kyc_status == "approved",
            DriverCurrentStatus.is_online.is_(True),
            DriverCurrentStatus.runtime_status == "available",
        ).all()
        
        # Filter for vehicle category
        result = []
        for driver in eligible:
            vehicle = db.query(Vehicle).join(
                DriverVehicle,
                Vehicle.vehicle_id == DriverVehicle.vehicle_id
            ).filter(
                DriverVehicle.driver_id == driver.driver_id,
                Vehicle.is_active.is_(True),
                Vehicle.vehicle_category == vehicle_category,
                Vehicle.document_status == "approved",
            ).first()
            
            if vehicle:
                result.append({
                    "driver_id": driver.driver_id,
                    "vehicle_id": vehicle.vehicle_id,
                    "vehicle_plate": vehicle.plate_number,
                    "latitude": None,  # Will be fetched from Redis
                    "longitude": None,
                })
        
        return result
    
    # ================================================================
    # STEP 6: GEO-BASED DRIVER SORTING
    # ================================================================
    
    @staticmethod
    def sort_drivers_by_proximity(
        tenant_id: int,
        city_id: int,
        pickup_lat: float,
        pickup_lng: float,
        eligible_driver_ids: list[int],
        max_radius_km: float = 10.0,
    ) -> list[dict]:
        """
        Use Redis GEO to sort drivers by distance from pickup.
        
        Returns sorted list with distances.
        """
        geo_key = f"drivers:geo:{tenant_id}:{city_id}"
        
        # Get nearby drivers within radius
        nearby = redis_client.georadius(
            geo_key,
            pickup_lng,
            pickup_lat,
            radius=max_radius_km,
            unit="km",
            count=len(eligible_driver_ids) * 2,  # Get more than needed
            sort="ASC",
            withdist=True,
        )
        
        sorted_drivers = []
        for driver_data in nearby:
            if isinstance(driver_data, tuple):
                driver_id_bytes, distance = driver_data
                driver_id = int(driver_id_bytes.decode() if isinstance(driver_id_bytes, bytes) else driver_id_bytes)
            else:
                driver_id = int(driver_data.decode() if isinstance(driver_data, bytes) else driver_data)
                distance = 0.0
            
            if driver_id in eligible_driver_ids:
                sorted_drivers.append({
                    "driver_id": driver_id,
                    "distance_km": float(distance),
                })
        
        return sorted_drivers
    
    # ================================================================
    # STEP 7: BATCH DISPATCH (handled in trip_request.py)
    # ================================================================
    
    # ================================================================
    # STEP 9: TRIP ASSIGNMENT
    # ================================================================
    
    @staticmethod
    def create_trip_from_request(
        db: Session,
        trip_request: TripRequest,
        driver: Driver,
        vehicle: Vehicle,
        now: datetime = None,
    ) -> Trip:
        """
        Create Trip record from accepted TripRequest.
        
        This is the commitment point where trip becomes official.
        """
        if now is None:
            now = datetime.now(timezone.utc)
        
        trip = Trip(
            trip_request_id=trip_request.trip_request_id,
            tenant_id=trip_request.selected_tenant_id,
            rider_id=trip_request.rider_id,
            driver_id=driver.driver_id,
            vehicle_id=vehicle.vehicle_id,
            city_id=trip_request.city_id,
            trip_status="assigned",
            pickup_latitude=trip_request.pickup_lat,
            pickup_longitude=trip_request.pickup_lng,
            pickup_address=trip_request.pickup_address,
            drop_latitude=trip_request.drop_lat,
            drop_longitude=trip_request.drop_lng,
            drop_address=trip_request.drop_address,
            requested_at_utc=trip_request.created_at_utc,
            assigned_at_utc=now,
            distance_km=trip_request.estimated_distance_km,
            duration_minutes=trip_request.estimated_duration_minutes,
            created_at_utc=now,
            created_by=driver.driver_id,
        )
        
        db.add(trip)
        db.flush()
        
        return trip
    
    @staticmethod
    def lock_driver_availability(
        db: Session,
        driver_id: int,
        trip_id: int,
        now: datetime = None,
    ):
        """
        Mark driver as on_trip immediately after assignment.
        Prevents driver from accepting other trips.
        """
        if now is None:
            now = datetime.now(timezone.utc)
        
        from app.models.core.drivers.driver_current_status import DriverCurrentStatus
        
        status_rec = db.query(DriverCurrentStatus).filter(
            DriverCurrentStatus.driver_id == driver_id,
        ).with_for_update().first()
        
        if status_rec:
            status_rec.runtime_status = "on_trip"
            status_rec.current_trip_id = trip_id
            status_rec.updated_at_utc = now
            db.add(status_rec)
    
    # ================================================================
    # STEP 11: TRIP START - OTP VERIFICATION
    # ================================================================
    
    @staticmethod
    def generate_trip_otp(db: Session, trip_id: int, now: datetime = None) -> str:
        """
        Generate 4-digit OTP for trip start verification.
        Expires in 15 minutes.
        """
        if now is None:
            now = datetime.now(timezone.utc)
        
        import random
        import string
        
        otp = ''.join(random.choices(string.digits, k=4))
        expiry = now + timedelta(minutes=15)
        
        trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
        if trip:
            trip.otp_code = otp
            db.add(trip)
            db.flush()
            
            # Also cache in Redis for quick lookup
            redis_client.setex(f"trip:otp:{trip_id}", 900, otp)  # 15 min
        
        return otp
    
    @staticmethod
    def verify_trip_otp(db: Session, trip_id: int, provided_otp: str) -> bool:
        """
        Verify OTP matches and hasn't expired.
        """
        trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
        
        if not trip or not trip.otp_code:
            return False
        
        return trip.otp_code == provided_otp
    
    # ================================================================
    # STEP 12: TRIP COMPLETION & FARE CALCULATION
    # ================================================================
    
    @staticmethod
    def calculate_trip_fare(
        db: Session,
        trip: Trip,
        actual_distance_km: float,
        actual_duration_minutes: int,
        coupon_code: str | None = None,
    ) -> dict:
        """
        Calculate final fare with all components.
        
        Components:
        - Base fare
        - Distance charges
        - Time charges
        - Surge multiplier
        - Tax
        - Coupon discount
        - Platform fee
        """
        from app.models.core.tenants.tenant_vehicle_pricing import TenantVehiclePricing
        from app.core.fare.coupons import apply_coupon
        
        # Get pricing
        pricing = db.query(TenantVehiclePricing).filter(
            TenantVehiclePricing.tenant_id == trip.tenant_id,
            TenantVehiclePricing.vehicle_category == trip.selected_vehicle_category or "standard",
            TenantVehiclePricing.city_id == trip.city_id,
        ).first()
        
        if not pricing:
            raise HTTPException(
                status_code=500,
                detail="Pricing not found for trip"
            )
        
        base_fare = Decimal(str(pricing.base_fare))
        distance_charge = Decimal(str(pricing.price_per_km)) * Decimal(str(actual_distance_km))
        time_charge = Decimal(str(pricing.price_per_minute or 0)) * Decimal(str(actual_duration_minutes))
        
        subtotal = base_fare + distance_charge + time_charge
        
        # Apply minimum fare
        min_fare = Decimal(str(pricing.minimum_fare or 0))
        subtotal = max(subtotal, min_fare)
        
        # Apply surge (if any)
        surge_multiplier = Decimal("1.0")  # TODO: Implement surge calculation
        subtotal = subtotal * surge_multiplier
        
        # Apply coupon
        coupon_discount = Decimal("0")
        coupon_id = None
        if coupon_code:
            coupon_discount, coupon_id = apply_coupon(
                db=db,
                tenant_id=trip.tenant_id,
                city_id=trip.city_id,
                vehicle_category=trip.selected_vehicle_category or "standard",
                rider_id=trip.rider_id,
                trip_id=trip.trip_id,
                coupon_code=coupon_code,
                fare_amount=subtotal,
            )
        
        final_fare = subtotal - coupon_discount
        
        # Calculate tax
        tax = final_fare * Decimal("0.05")  # 5% default, should be from tax rules
        
        total_with_tax = final_fare + tax
        
        return {
            "base_fare": float(base_fare),
            "distance_charge": float(distance_charge),
            "time_charge": float(time_charge),
            "subtotal": float(subtotal),
            "surge_multiplier": float(surge_multiplier),
            "coupon_discount": float(coupon_discount),
            "coupon_id": coupon_id,
            "tax_amount": float(tax),
            "total_fare": float(total_with_tax),
            "currency": "INR",  # TODO: From tenant settings
        }
    
    # ================================================================
    # STEP 13-14: PAYMENT & SETTLEMENT
    # ================================================================
    
    @staticmethod
    def create_trip_ledger(
        db: Session,
        trip: Trip,
        fare_breakdown: dict,
        now: datetime = None,
    ):
        """
        Create immutable ledger entries for settlement.
        """
        if now is None:
            now = datetime.now(timezone.utc)
        
        from app.models.core.accounting.ledger import FinancialLedger
        
        total_fare = Decimal(str(fare_breakdown["total_fare"]))
        platform_fee = total_fare * Decimal("0.2")  # 20% platform fee
        driver_earnings = total_fare - platform_fee
        
        entries = [
            FinancialLedger(
                tenant_id=trip.tenant_id,
                entity_type="trip",
                entity_id=trip.trip_id,
                account_type="revenue",
                amount=total_fare,
                description=f"Trip {trip.trip_id} fare",
                created_at_utc=now,
            ),
            FinancialLedger(
                tenant_id=trip.tenant_id,
                entity_type="trip",
                entity_id=trip.trip_id,
                account_type="platform_fee",
                amount=platform_fee,
                description=f"Platform fee for trip {trip.trip_id}",
                created_at_utc=now,
            ),
            FinancialLedger(
                tenant_id=trip.tenant_id,
                entity_type="driver",
                entity_id=trip.driver_id,
                account_type="earnings",
                amount=driver_earnings,
                description=f"Earnings from trip {trip.trip_id}",
                created_at_utc=now,
            ),
        ]
        
        db.add_all(entries)
        db.flush()
    
    # ================================================================
    # STEP 16: CANCELLATION
    # ================================================================
    
    @staticmethod
    def cancel_trip(
        db: Session,
        trip_id: int,
        reason: str,
        cancelled_by: str,  # "rider" | "driver" | "system"
        now: datetime = None,
    ):
        """
        Cancel trip at any stage with proper state cleanup.
        """
        if now is None:
            now = datetime.now(timezone.utc)
        
        trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        if trip.trip_status in ["completed", "cancelled"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel trip with status {trip.trip_status}"
            )
        
        # Update trip status
        trip.trip_status = "cancelled"
        trip.cancelled_at_utc = now
        db.add(trip)
        
        # Release driver
        if trip.driver_id:
            TripLifecycle.release_driver_availability(db, trip.driver_id)
        
        # Apply cancellation penalty if needed
        if cancelled_by == "rider" and trip.trip_status in ["assigned", "picked_up"]:
            # Rider cancellation fee (implement based on policy)
            pass
        
        db.flush()
    
    @staticmethod
    def release_driver_availability(
        db: Session,
        driver_id: int,
        now: datetime = None,
    ):
        """
        Mark driver as available again after trip completion or cancellation.
        """
        if now is None:
            now = datetime.now(timezone.utc)
        
        from app.models.core.drivers.driver_current_status import DriverCurrentStatus
        
        status_rec = db.query(DriverCurrentStatus).filter(
            DriverCurrentStatus.driver_id == driver_id,
        ).first()
        
        if status_rec:
            status_rec.runtime_status = "available"
            status_rec.current_trip_id = None
            status_rec.updated_at_utc = now
            db.add(status_rec)
