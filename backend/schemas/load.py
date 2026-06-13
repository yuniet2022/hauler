from pydantic import BaseModel
from typing import Optional, Any, Dict

class CreateLoadRequest(BaseModel):
    origin: str
    destination: str
    target_price: float = 0

    vehicle_year: Optional[int] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vin: Optional[str] = None

    origin_obj: Optional[Dict[str, Any]] = None
    destination_obj: Optional[Dict[str, Any]] = None

    route_summary: Optional[Dict[str, Any]] = None

class OfferRequest(BaseModel):
    offer_price: float
    message: Optional[str] = None
