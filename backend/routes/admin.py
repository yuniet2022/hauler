# routes/admin.py

from datetime import datetime, timedelta
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from core.deps import get_db, require_admin
from core.config import settings
import uuid
from models.user import User
from models.company import Company, CompanyUser
from models.subscription import CompanySubscription
from models.kyc_document import KycDocument
from models.client_document import ClientDocument
from models.client_face_verification import ClientFaceVerification
from core.email_service import send_email
from core.mailer import send_account_approved_email, send_account_rejected_email
router = APIRouter(prefix="/admin", tags=["admin"])


def _get_company_owner(db: Session, company_id):
    owner_link = (
        db.query(CompanyUser)
        .filter(
            CompanyUser.company_id == company_id,
            CompanyUser.role_in_company == "OWNER",
        )
        .first()
    )

    if not owner_link:
        return None, None

    owner = db.query(User).filter(User.id == owner_link.user_id).first()
    return owner_link, owner

@router.get("/pending")
def pending(db: Session = Depends(get_db), ctx=Depends(require_admin)):
    # Solo users pendientes que NO pertenezcan a una compañía
    pending_users = (
        db.query(User)
        .filter(User.status == "PENDING")
        .filter(
            ~db.query(CompanyUser)
            .filter(CompanyUser.user_id == User.id)
            .exists()
        )
        .order_by(User.created_at.desc())
        .all()
    )

    pending_companies = (
        db.query(Company)
        .filter(Company.approval_status == "PENDING")
        .order_by(Company.created_at.desc())
        .all()
    )

    companies_payload = []
    for c in pending_companies:
        owner_link, owner = _get_company_owner(db, c.id)
        docs = db.query(KycDocument).filter(KycDocument.company_id == c.id).all()

        companies_payload.append(
            {
                "id": str(c.id),
                "display_name": c.display_name,
                "legal_name": c.legal_name,
                "type": c.company_type,
                "state": c.state,
                "city": c.city,
                "address1": c.address1,
                "zip": c.zip,
                "phone": c.phone,
                "dot_number": c.dot_number,
                "mc_number": c.mc_number,
                "approval_status": c.approval_status,
                "owner": {
                    "id": str(owner.id) if owner else None,
                    "name": owner.name if owner else None,
                    "email": owner.email if owner else None,
                    "phone": owner.phone if owner else None,
                    "status": owner.status if owner else None,
                },
                "docs_count": len(docs),
                "docs_types": [d.doc_type for d in docs],
            }
        )

    return {
        "users": [
            {
                "id": str(u.id),
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "status": u.status,
            }
            for u in pending_users
        ],
        "companies": companies_payload,
    }

@router.post("/users/{user_id}/approve")
def approve_user(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="user_not_found")

    approve = bool(payload.get("approve"))
    u.status = "ACTIVE" if approve else "DISABLED"
    db.commit()
    db.refresh(u)

    if u.email:
        try:
            if approve:
                send_account_approved_email(u.email, u.name or "")
            else:
                send_account_rejected_email(u.email, u.name or "")
        except Exception as e:
            print("EMAIL_SEND_ERROR approve_user:", str(e))

    return {"status": u.status}


@router.post("/companies/{company_id}/approve")
def approve_company(
    company_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="company_not_found")

    owner_link, owner = _get_company_owner(db, c.id)
    approve = bool(payload.get("approve"))

    # REJECT
    if not approve:
        c.approval_status = "REJECTED"

        if owner:
            owner.status = "DISABLED"

        docs = db.query(KycDocument).filter(KycDocument.company_id == c.id).all()
        for d in docs:
            d.status = "REJECTED"

        db.commit()
        db.refresh(c)

        if owner and owner.email:
            try:
                send_account_rejected_email(
                    to_email=owner.email,
                    name=getattr(owner, "full_name", "") or getattr(owner, "name", "") or "",
                )
            except Exception as e:
                print("reject email failed:", str(e))

        return {"approval_status": c.approval_status}

    # APPROVE
    docs = db.query(KycDocument).filter(KycDocument.company_id == c.id).all()
    if not docs:
        raise HTTPException(status_code=400, detail="kyc_documents_required")

    c.approval_status = "APPROVED"
    c.status = "ACTIVE"

    if owner:
        owner.status = "ACTIVE"

    for d in docs:
        d.status = "VERIFIED"

    db.commit()
    db.refresh(c)

    sub = (
        db.query(CompanySubscription)
        .filter(CompanySubscription.company_id == c.id)
        .first()
    )

    if not sub:
        now = datetime.utcnow()
        trial_end = now + timedelta(days=int(getattr(settings, "trial_days", 7)))

        sub = CompanySubscription(
            id=uuid.uuid4(),
            company_id=c.id,
            plan_code="TRIAL",
            status="TRIAL",
            trial_ends_at=trial_end,
            current_period_start=now,
            current_period_end=trial_end,
            price_effective_monthly=0,
            auto_disable_on_due=True,
        )

        db.add(sub)
        db.commit()
        db.refresh(sub)

    if owner and owner.email:
        try:
            send_account_approved_email(
                to_email=owner.email,
                name=getattr(owner, "full_name", "") or getattr(owner, "name", "") or "",
            )
        except Exception as e:
            print("approval email failed:", str(e))

    return {
        "approval_status": c.approval_status,
        "subscription_status": sub.status,
    }
@router.get("/users/{user_id}/kyc")
def get_user_kyc(
    user_id: str,
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")

    # CLIENT FLOW
    if user.role == "client":
        docs = (
            db.query(ClientDocument)
            .filter(ClientDocument.user_id == user.id)
            .order_by(ClientDocument.created_at.desc())
            .all()
        )

        face_verification = (
            db.query(ClientFaceVerification)
            .filter(ClientFaceVerification.user_id == user.id)
            .first()
        )

        assets = [
            {
                "id": str(d.id),
                "kind": d.doc_type,
                "url": f"/api/admin/client-documents/{d.id}/download",
                "file_name": d.file_name,
                "content_type": d.content_type,
                "status": d.status,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in docs
        ]

        return {
            "has_kyc": len(docs) > 0,
            "submission": {
                "company_name": user.name,
                "company_type": "CLIENT",
                "approval_status": user.status,
                "owner_name": user.name,
                "owner_email": user.email,
                "owner_phone": user.phone,
                "dot_number": None,
                "mc_number": None,
                "address1": None,
                "city": None,
                "state": None,
                "zip": None,
            },
            "assets": assets,
            "face_verification": {
                "movement_passed": face_verification.movement_passed if face_verification else False,
                "similarity_score": face_verification.similarity_score if face_verification else 0,
                "face_distance": face_verification.face_distance if face_verification else 1,
                "provisional_access": face_verification.provisional_access if face_verification else False,
                "admin_review_status": face_verification.admin_review_status if face_verification else "PENDING",
                "notes": face_verification.notes if face_verification else None,
            },
        }

    # COMPANY FLOW
    company_user = (
        db.query(CompanyUser)
        .filter(
            CompanyUser.user_id == user_id,
            CompanyUser.role_in_company == "OWNER",
        )
        .first()
    )

    if not company_user:
        return {
            "has_kyc": False,
            "submission": None,
            "assets": [],
        }

    company = db.query(Company).filter(Company.id == company_user.company_id).first()
    if not company:
        return {
            "has_kyc": False,
            "submission": None,
            "assets": [],
        }

    docs = (
        db.query(KycDocument)
        .filter(KycDocument.company_id == company.id)
        .order_by(KycDocument.created_at.desc())
        .all()
    )

    assets = []
    for d in docs:
        assets.append(
            {
                "id": str(d.id),
                "kind": d.doc_type,
                "url": f"/api/admin/kyc-documents/{d.id}/download",
                "file_name": d.file_name,
                "content_type": d.content_type,
                "status": d.status,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
        )

    return {
        "has_kyc": len(docs) > 0,
        "submission": {
            "company_id": str(company.id),
            "company_name": company.legal_name,
            "display_name": company.display_name,
            "company_type": company.company_type,
            "approval_status": company.approval_status,
            "status": company.status,
            "owner_name": user.name if user else None,
            "owner_email": user.email if user else None,
            "owner_phone": user.phone if user else None,
            "dot_number": company.dot_number,
            "mc_number": company.mc_number,
            "address1": company.address1,
            "city": company.city,
            "state": company.state,
            "zip": company.zip,
            "created_at": company.created_at.isoformat() if company.created_at else None,
        },
        "assets": assets,
    }
@router.get("/client-documents/{doc_id}/download")
def download_client_document(
    doc_id: str,
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    doc = db.query(ClientDocument).filter(ClientDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="doc_not_found")

    if not doc.storage_path or not os.path.exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="doc_file_not_found")

    return FileResponse(
        path=doc.storage_path,
        filename=doc.file_name,
        media_type=doc.content_type or "application/octet-stream",
    )

@router.get("/kyc-documents/{doc_id}/download")
def download_kyc_document(
    doc_id: str,
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    doc = db.query(KycDocument).filter(KycDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="doc_not_found")

    if not doc.storage_path or not os.path.exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="doc_file_not_found")

    return FileResponse(
        path=doc.storage_path,
        filename=doc.file_name,
        media_type=doc.content_type or "application/octet-stream",
    )
