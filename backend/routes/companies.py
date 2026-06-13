from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.deps import get_db, require_company_owner_or_manager
from core.security import hash_password
from models.user import User
from models.company import CompanyUser
from schemas.company import InviteCompanyUserRequest

router = APIRouter(prefix="/api/company", tags=["company"])

@router.post("/users/invite")
def invite_user(payload: InviteCompanyUserRequest, db: Session = Depends(get_db), ctx=Depends(require_company_owner_or_manager)):
    user, cu, company, sub = ctx

    email = payload.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="EMAIL_ALREADY_EXISTS")

    new_user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role="client",     # global role stays admin/client; company perms in company_users
        status="ACTIVE",   # company already approved & subscription valid, so internal users can be active
        phone=payload.phone,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    link = CompanyUser(
        company_id=company.id,
        user_id=new_user.id,
        role_in_company=payload.role_in_company.strip().upper(),
        status="ACTIVE",
    )
    db.add(link)
    db.commit()

    return {"status": "INVITED", "user_id": str(new_user.id)}
