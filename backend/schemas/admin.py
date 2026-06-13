from pydantic import BaseModel
from typing import Optional, Any, Dict

class ApproveUserRequest(BaseModel):
    approve: bool

class ApproveCompanyRequest(BaseModel):
    approve: bool

class UpdatePlanRequest(BaseModel):
    default_monthly_price: Optional[float] = None
    features_json: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class UpdateCompanySubscriptionRequest(BaseModel):
    plan_code: Optional[str] = None  # BASIC/ADVANCED
    price_override_monthly: Optional[float] = None
    features_override_json: Optional[Dict[str, Any]] = None
