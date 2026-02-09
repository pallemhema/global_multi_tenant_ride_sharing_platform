from pydantic import BaseModel, ConfigDict

class CountryOut(BaseModel):
    country_id: int
    country_code: str
    country_name: str
    phone_code: str
    default_currency: str
    timezone: str

    model_config = ConfigDict(from_attributes=True)
