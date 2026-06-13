import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.deps import get_db
from core.config import settings
from core.security import hash_password, create_token

from models.user import User
from models.company import Company, CompanyUser

router = APIRouter(prefix="/users", tags=["users"])


@router.post("")
def register(user_data: dict, db: Session = Depends(get_db)):
    email = (user_data.get("email") or "").strip().lower()
    password = (user_data.get("password") or "").strip()
    role = (user_data.get("role") or "").strip().lower()
    phone = (user_data.get("phone") or "").strip() or None

    metadata = user_data.get("metadata") or {}

    company_name = (user_data.get("name") or "").strip()
    owner_name = (metadata.get("owner_name") or company_name).strip()
    dot = (metadata.get("dot") or "").strip()
    mc = (metadata.get("mc") or "").strip()
    address1 = (metadata.get("address1") or "").strip() or None
    city = (metadata.get("city") or "").strip() or None
    state = (metadata.get("state") or "").strip() or None
    zip_code = (metadata.get("zip") or "").strip() or None

    if not email or not password or not company_name or not role:
        raise HTTPException(status_code=422, detail="missing_required_fields")

    if role not in settings.allowed_public_roles:
        raise HTTPException(status_code=422, detail="INVALID_ROLE")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="EMAIL_ALREADY_EXISTS")

    try:
        user = User(
            name=owner_name,
            email=email,
            password_hash=hash_password(password),
            role=role,
            status="PENDING",
            phone=phone,
        )
        db.add(user)
        db.flush()

        if role in ("carrier", "dealer", "tow"):
            name_key = re.sub(r"[^a-z0-9]+", "", company_name.lower())
            if not name_key:
                name_key = str(uuid.uuid4()).replace("-", "")

            company = Company(
                id=uuid.uuid4(),
                company_type=role.upper(),
                legal_name=company_name,
                display_name=company_name,
                name_key=name_key,
                state=state or "FL",
                city=city,
                address1=address1,
                address2=None,
                zip=zip_code,
                phone=phone,
                dot_number=dot or None,
                mc_number=mc or None,
                approval_status="PENDING",
                status="ACTIVE",
            )
            db.add(company)
            db.flush()

            company_user = CompanyUser(
                id=uuid.uuid4(),
                company_id=company.id,
                user_id=user.id,
                role_in_company="OWNER",
                status="ACTIVE",
            )
            db.add(company_user)

        db.commit()
        db.refresh(user)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"register_failed: {str(e)}")

    kyc_token = create_token(
        {
            "sub": str(user.id),
            "role": user.role,
            "scope": "KYC",
        }
    )

    return {
        "id": str(user.id),
        "status": "PENDING_APPROVAL",
        "kyc_token": kyc_token,
        "message": "Cuenta creada. Pendiente de preaprobación. Complete la verificación (KYC).",
    }


@router.get("")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "status": u.status,
        }
        for u in users
    ]
