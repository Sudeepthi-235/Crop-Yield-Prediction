from pydantic import BaseModel, Field
from typing import Optional, Any


class Location(BaseModel):
    lat: float
    lon: float


class Soil(BaseModel):
    type: Optional[str] = "loamy"
    ph: Optional[float] = 6.5
    organic_carbon: Optional[float] = 0.6
    nitrogen: Optional[Any] = 2
    phosphorus: Optional[Any] = 2
    potassium: Optional[Any] = 2


class PredictRequest(BaseModel):
    crop: str = Field(default="rice", example="rice")
    location: Location
    sowing_date: str = Field(example="2026-01-10")
    soil: Optional[Soil] = None
    land_area: Optional[float] = 1.0
