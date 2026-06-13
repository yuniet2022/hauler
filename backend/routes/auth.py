from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import re

from core.deps import get_db, get_current_user
from core.security import hash_password, verify_password, create_token
from models.user import User
from models.company import Company, CompanyUser
from schemas.auth import LoginRequest, LoginResponse, RegisterClientRequest, RegisterCompanyRequest
from pydantic import BaseModel
#from auth_jwt import verify_password, hash_password

router = APIRouter()


def norm_key(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")

    # ✅ approval gate
    if user.status != "ACTIVE":
        raise HTTPException(status_code=403, detail=f"USER_{user.status}")  # USER_PENDING / USER_DISABLED

    token = create_token({"sub": str(user.id), "role": user.role})
    return {
        "token": token,
        "token_type": "bearer",
        "must_change_password": bool(getattr(user, "must_change_password", False)),
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status
        },
    }


@router.post("/register-client")
def register_client(payload: RegisterClientRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    exists = db.query(User).filter(User.email == email).first()
    if exists:
        raise HTTPException(status_code=400, detail="EMAIL_ALREADY_EXISTS")

    u = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role="client",
        status="PENDING",
        phone=payload.phone,
    )
    db.add(u)
    db.commit()
    return {"status": "PENDING_APPROVAL"}


@router.post("/register-company")
def register_company(payload: RegisterCompanyRequest, db: Session = Depends(get_db)):
    owner_email = payload.owner_email.strip().lower()
    if db.query(User).filter(User.email == owner_email).first():
        raise HTTPException(status_code=400, detail="EMAIL_ALREADY_EXISTS")

    nk = norm_key(payload.legal_name)
    dup = db.query(Company).filter(
        Company.state == payload.state.strip().upper(),
        Company.name_key == nk
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="COMPANY_ALREADY_EXISTS_IN_STATE")

    # company pending
    c = Company(
        company_type=payload.company_type.strip().upper(),
        legal_name=payload.legal_name.strip(),
        display_name=payload.display_name.strip(),
        name_key=nk,
        state=payload.state.strip().upper(),
        city=(payload.city or None),
        address1=(payload.address1 or None),
        address2=(payload.address2 or None),
        zip=(payload.zip or None),
        phone=(payload.phone or None),
        approval_status="PENDING",
        status="ACTIVE",
    )
    db.add(c)
    db.commit()
    db.refresh(c)

    # owner user pending
    u = User(
        name=payload.owner_name.strip(),
        email=owner_email,
        password_hash=hash_password(payload.owner_password),
        role="client",
        status="PENDING",
        phone=payload.owner_phone,
    )
    db.add(u)
    db.commit()
    db.refresh(u)

    cu = CompanyUser(
        company_id=c.id,
        user_id=u.id,
        role_in_company="OWNER",
        status="ACTIVE",
    )
    db.add(cu)
    db.commit()

    return {"status": "PENDING_APPROVAL", "company_id": str(c.id)}


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(
    payload: ChangePasswordPayload,
    db: Session = Depends(get_db),
    auth=Depends(get_current_user),
):
    user, _, _, _ = auth

    db_user = db.query(User).filter(User.id == user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="user_not_found")

    if not verify_password(payload.current_password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="current_password_invalid")

    if len(payload.new_password or "") < 8:
        raise HTTPException(status_code=422, detail="new_password_too_short")

    db_user.password_hash = hash_password(payload.new_password)
    db_user.must_change_password = False

    db.commit()

    return {"ok": True}

