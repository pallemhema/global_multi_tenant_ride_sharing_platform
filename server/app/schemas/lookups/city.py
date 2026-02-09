from pydantic import BaseModel, ConfigDict

class CityOut(BaseModel):
    city_id: int
    country_id: int
    city_name: str
    timezone: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
