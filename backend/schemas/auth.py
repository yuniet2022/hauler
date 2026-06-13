from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    must_change_password: bool = False
    user: dict

class RegisterClientRequest(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=6)
    phone: Optional[str] = None

class RegisterCompanyRequest(BaseModel):
    # owner user
    owner_name: str = Field(min_length=2)
    owner_email: EmailStr
    owner_password: str = Field(min_length=6)
    owner_phone: Optional[str] = None

    # company
    company_type: str  # DEALER/CARRIER/TOW
    legal_name: str
    display_name: str
    state: str
    city: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    zip: Optional[str] = None
    phone: Optional[str] = None
