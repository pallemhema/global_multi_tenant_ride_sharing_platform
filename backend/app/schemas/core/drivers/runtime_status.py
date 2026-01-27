from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
from typing import Optional


RuntimeStatusCode = Literal[
    "available",
    "on_trip",
    "unavailable",
]


class RuntimeStatusSchema(BaseModel):
    runtime_status: RuntimeStatusCode = Field(
        ...,
        description="Driver trip availability state",
    )

    reason: Optional[str] = Field(
        None,
        description="Optional reason when setting unavailable",
        max_length=255,
    )

    updated_at_utc: Optional[datetime] = Field(
        None,
        description="Server-controlled update time",
    )
