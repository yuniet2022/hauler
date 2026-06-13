from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class InviteCompanyUserRequest(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=6)
    role_in_company: str = Field(default="STAFF")  # OWNER/MANAGER/STAFF
    phone: Optional[str] = None
