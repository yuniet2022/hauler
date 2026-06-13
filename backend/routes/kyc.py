import os
import uuid
import shutil

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user_kyc
from models.user import User
from models.company import Company, CompanyUser
from models.kyc_document import KycDocument

router = APIRouter(prefix="/kyc", tags=["kyc"])

UPLOAD_ROOT = "/var/www/html/app/backend/uploads/kyc"


def _save_upload(company_id: str, doc_type: str, upload: UploadFile) -> tuple[str, str, str]:
    safe_name = (upload.filename or "document").replace("/", "_").replace("\\", "_").strip()
    ext = os.path.splitext(safe_name)[1] or ""
    final_name = f"{doc_type.lower()}_{uuid.uuid4().hex}{ext}"

    folder = os.path.join(UPLOAD_ROOT, company_id)
    os.makedirs(folder, exist_ok=True)

    file_path = os.path.join(folder, final_name)

    with open(file_path, "wb") as out_file:
        shutil.copyfileobj(upload.file, out_file)

    return safe_name, (upload.content_type or "application/octet-stream"), file_path


@router.post("/documents")
def upload_kyc_documents(
    owner_license: UploadFile = File(...),
    insurance_doc: UploadFile | None = File(default=None),
    authority_doc: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_kyc),
):
    company_user = (
        db.query(CompanyUser)
        .filter(CompanyUser.user_id == user.id, CompanyUser.status == "ACTIVE")
        .first()
    )
    if not company_user:
        raise HTTPException(status_code=400, detail="company_user_required_for_kyc")

    company = db.query(Company).filter(Company.id == company_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="company_not_found")

    try:
        docs_to_process = [
            ("OWNER_LICENSE", owner_license),
            ("INSURANCE", insurance_doc),
            ("AUTHORITY", authority_doc),
        ]

        for doc_type, upload in docs_to_process:
            if upload is None:
                continue

            existing = (
                db.query(KycDocument)
                .filter(KycDocument.company_id == company.id, KycDocument.doc_type == doc_type)
                .first()
            )
            if existing and existing.storage_path and os.path.exists(existing.storage_path):
                try:
                    os.remove(existing.storage_path)
                except Exception:
                    pass
                db.delete(existing)
                db.flush()

            original_name, content_type, storage_path = _save_upload(
                str(company.id),
                doc_type,
                upload,
            )

            row = KycDocument(
                company_id=company.id,
                user_id=user.id,
                doc_type=doc_type,
                file_name=original_name,
                content_type=content_type,
                storage_path=storage_path,
                status="UPLOADED",
            )
            db.add(row)

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"kyc_upload_failed: {str(e)}")

    return {
        "status": "OK",
        "message": "KYC documents uploaded successfully.",
        "company_id": str(company.id),
    }
