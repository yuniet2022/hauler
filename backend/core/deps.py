# core/deps.py
from typing import Optional, Tuple
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from db.session import SessionLocal
from core.security import decode_token
from models.user import User
from models.company import Company, CompanyUser
from models.subscription import CompanySubscription
from models.client_face_verification import ClientFaceVerification

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _decode_bearer(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing_bearer_token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        return decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid_token")

def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Tuple[User, Optional[CompanyUser], Optional[Company], Optional[CompanySubscription]]:
    data = _decode_bearer(authorization)

    user_id = data.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="invalid_token_sub")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="user_not_found")

    # Strict approval: ALL users must be ACTIVE to use system
    if user.status != "ACTIVE":
        if user.role == "client" and user.status == "PENDING":
            verification = (
                db.query(ClientFaceVerification)
                .filter(ClientFaceVerification.user_id == user.id)
                .first()
            )
            if not verification or not verification.provisional_access:
                raise HTTPException(status_code=403, detail="USER_NOT_APPROVED")
        else:
            raise HTTPException(status_code=403, detail="USER_NOT_APPROVED")
    cu = (
        db.query(CompanyUser)
        .filter(CompanyUser.user_id == user.id, CompanyUser.status == "ACTIVE")
        .first()
    )
    if not cu:
        return (user, None, None, None)

    company = db.query(Company).filter(Company.id == cu.company_id).first()
    if not company:
        raise HTTPException(status_code=403, detail="company_not_found")

    if company.approval_status != "APPROVED":
        raise HTTPException(status_code=403, detail="COMPANY_NOT_APPROVED")

    if company.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="COMPANY_INACTIVE")

    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == company.id).first()
    if not sub:
        raise HTTPException(status_code=403, detail="COMPANY_SUBSCRIPTION_MISSING")

    if sub.status not in ("TRIAL", "ACTIVE"):
        raise HTTPException(status_code=403, detail="COMPANY_SUBSCRIPTION_REQUIRED")

    return (user, cu, company, sub)

# ✅ PENDING allowed ONLY for KYC flow
def get_current_user_kyc(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    data = _decode_bearer(authorization)

    user_id = data.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="invalid_token_sub")

    scope = (data.get("scope") or "").strip().upper()
    if scope != "KYC":
        raise HTTPException(status_code=403, detail="KYC_SCOPE_REQUIRED")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="user_not_found")

    # Here: allow PENDING
    if user.status not in ("PENDING", "ACTIVE"):
        raise HTTPException(status_code=403, detail="USER_NOT_ALLOWED")

    return user

def require_admin(ctx=Depends(get_current_user)):
    user, cu, company, sub = ctx
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="admin_required")
    return ctx

def require_client(ctx=Depends(get_current_user)):
    user, cu, company, sub = ctx
    if user.role != "client":
        raise HTTPException(status_code=403, detail="client_required")
    return ctx

def require_company(ctx=Depends(get_current_user)):
    user, cu, company, sub = ctx
    if not cu or not company:
        raise HTTPException(status_code=403, detail="company_user_required")
    return ctx

def require_company_owner_or_manager(ctx=Depends(get_current_user)):
    user, cu, company, sub = ctx
    if not cu or cu.role_in_company not in ("OWNER", "MANAGER"):
        raise HTTPException(status_code=403, detail="owner_or_manager_required")
    return ctx

