import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from core.deps import get_db, require_admin
from models.company import Company, CompanyUser
from models.user import User
from models.kyc_document import KycDocument

router = APIRouter(prefix="/admin", tags=["admin-kyc"])


def _company_owner(db: Session, company_id):
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


@router.get("/pre-approvals")
def list_pre_approvals(ctx=Depends(require_admin), db: Session = Depends(get_db)):
    pending_companies = (
        db.query(Company)
        .filter(Company.approval_status == "PENDING")
        .order_by(Company.created_at.desc())
        .all()
    )

    rows = []
    for company in pending_companies:
        owner_link, owner = _company_owner(db, company.id)
        docs = db.query(KycDocument).filter(KycDocument.company_id == company.id).all()

        rows.append(
            {
                "company_id": str(company.id),
                "company_type": company.company_type,
                "company_name": company.legal_name,
                "display_name": company.display_name,
                "approval_status": company.approval_status,
                "phone": company.phone,
                "dot_number": company.dot_number,
                "mc_number": company.mc_number,
                "address1": company.address1,
                "city": company.city,
                "state": company.state,
                "zip": company.zip,
                "owner": {
                    "user_id": str(owner.id) if owner else None,
                    "name": owner.name if owner else None,
                    "email": owner.email if owner else None,
                    "phone": owner.phone if owner else None,
                    "status": owner.status if owner else None,
                },
                "docs_count": len(docs),
                "docs_types": [d.doc_type for d in docs],
                "created_at": company.created_at.isoformat() if company.created_at else None,
            }
        )

    return rows


@router.get("/pre-approvals/{company_id}")
def get_pre_approval_detail(company_id: str, ctx=Depends(require_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="company_not_found")

    owner_link, owner = _company_owner(db, company.id)
    docs = (
        db.query(KycDocument)
        .filter(KycDocument.company_id == company.id)
        .order_by(KycDocument.created_at.desc())
        .all()
    )

    return {
        "company": {
            "id": str(company.id),
            "company_type": company.company_type,
            "legal_name": company.legal_name,
            "display_name": company.display_name,
            "approval_status": company.approval_status,
            "status": company.status,
            "phone": company.phone,
            "dot_number": company.dot_number,
            "mc_number": company.mc_number,
            "address1": company.address1,
            "address2": company.address2,
            "city": company.city,
            "state": company.state,
            "zip": company.zip,
            "created_at": company.created_at.isoformat() if company.created_at else None,
        },
        "owner": {
            "user_id": str(owner.id) if owner else None,
            "name": owner.name if owner else None,
            "email": owner.email if owner else None,
            "phone": owner.phone if owner else None,
            "status": owner.status if owner else None,
            "role_in_company": owner_link.role_in_company if owner_link else None,
        },
        "documents": [
            {
                "id": str(d.id),
                "doc_type": d.doc_type,
                "file_name": d.file_name,
                "content_type": d.content_type,
                "status": d.status,
                "download_url": f"/api/admin/pre-approvals/docs/{d.id}/download",
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in docs
        ],
    }


@router.get("/pre-approvals/docs/{doc_id}/download")
def download_pre_approval_doc(doc_id: str, ctx=Depends(require_admin), db: Session = Depends(get_db)):
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


@router.post("/pre-approvals/{company_id}/approve")
def approve_pre_approval(company_id: str, ctx=Depends(require_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="company_not_found")

    owner_link, owner = _company_owner(db, company.id)
    if not owner:
        raise HTTPException(status_code=400, detail="company_owner_missing")

    docs = db.query(KycDocument).filter(KycDocument.company_id == company.id).all()
    if not docs:
        raise HTTPException(status_code=400, detail="kyc_documents_required")

    company.approval_status = "APPROVED"
    company.status = "ACTIVE"
    owner.status = "ACTIVE"

    for d in docs:
        d.status = "VERIFIED"

    db.commit()

    return {
        "status": "APPROVED",
        "company_id": str(company.id),
        "owner_user_id": str(owner.id),
    }


@router.post("/pre-approvals/{company_id}/reject")
def reject_pre_approval(company_id: str, ctx=Depends(require_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="company_not_found")

    owner_link, owner = _company_owner(db, company.id)

    company.approval_status = "REJECTED"

    if owner:
        owner.status = "DISABLED"

    docs = db.query(KycDocument).filter(KycDocument.company_id == company.id).all()
    for d in docs:
        d.status = "REJECTED"

    db.commit()

    return {
        "status": "REJECTED",
        "company_id": str(company.id),
    }
