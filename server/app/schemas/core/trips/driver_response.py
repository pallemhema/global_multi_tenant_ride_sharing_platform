from pydantic import BaseModel, Field
from typing import Literal


class DriverTripResponse(BaseModel):
    response: Literal["accepted", "rejected"] = Field(
        ...,
        description="Driver response to trip request"
    )