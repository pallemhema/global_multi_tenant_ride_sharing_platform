from pydantic import BaseModel,ConfigDict


class TripRequestCreate(BaseModel):
    city_id: int
    pickup_latitude: float
    pickup_longitude: float
    drop_latitude: float
    drop_longitude: float
    vehicle_category: str   # 🔑 REQUIRED


class TripOut(BaseModel):
    trip_id: int
    tenant_id: int
    rider_id: int
    trip_status: str

    model_config = ConfigDict(from_attributes=True)
    
