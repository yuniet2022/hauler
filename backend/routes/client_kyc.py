import os
import uuid
import shutil

import face_recognition
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user_kyc
from models.user import User
from models.client_document import ClientDocument
from models.client_face_verification import ClientFaceVerification

router = APIRouter(prefix="/client-kyc", tags=["client-kyc"])

UPLOAD_ROOT = "/var/www/html/app/backend/uploads/client_kyc"


def _save_upload(user_id: str, doc_type: str, upload: UploadFile) -> tuple[str, str, str]:
    safe_name = (upload.filename or "document").replace("/", "_").replace("\\", "_").strip()
    ext = os.path.splitext(safe_name)[1] or ""
    final_name = f"{doc_type.lower()}_{uuid.uuid4().hex}{ext}"

    folder = os.path.join(UPLOAD_ROOT, user_id)
    os.makedirs(folder, exist_ok=True)

    file_path = os.path.join(folder, final_name)

    upload.file.seek(0)
    with open(file_path, "wb") as out_file:
        shutil.copyfileobj(upload.file, out_file)

    return safe_name, (upload.content_type or "application/octet-stream"), file_path


def _face_encoding_from_path(image_path: str):
    image = face_recognition.load_image_file(image_path)
    encodings = face_recognition.face_encodings(image)
    if not encodings:
        return None
    return encodings[0]


@router.post("/verify")
async def verify_client_identity(
    license_image: UploadFile = File(...),
    selfie_image: UploadFile = File(...),
    movement_passed: bool = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_kyc),
):
    if user.role != "client":
        raise HTTPException(status_code=403, detail="client_only")

    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

    if not license_image:
        raise HTTPException(status_code=422, detail="license_image_required")

    if not selfie_image:
        raise HTTPException(status_code=422, detail="selfie_image_required")

    if (license_image.content_type or "").lower() not in allowed:
        raise HTTPException(status_code=422, detail="license_image_must_be_image")

    if (selfie_image.content_type or "").lower() not in allowed:
        raise HTTPException(status_code=422, detail="selfie_image_must_be_image")

    try:
        license_name, license_type, license_path = _save_upload(
            str(user.id), "CLIENT_LICENSE", license_image
        )
        selfie_name, selfie_type, selfie_path = _save_upload(
            str(user.id), "CLIENT_SELFIE", selfie_image
        )

        existing_docs = (
            db.query(ClientDocument)
            .filter(
                ClientDocument.user_id == user.id,
                ClientDocument.doc_type.in_(["CLIENT_LICENSE", "CLIENT_SELFIE"]),
            )
            .all()
        )

        for d in existing_docs:
            if d.storage_path and os.path.exists(d.storage_path):
                try:
                    os.remove(d.storage_path)
                except Exception:
                    pass
            db.delete(d)

        db.flush()

        db.add(
            ClientDocument(
                user_id=user.id,
                doc_type="CLIENT_LICENSE",
                file_name=license_name,
                content_type=license_type,
                storage_path=license_path,
                status="UPLOADED",
            )
        )

        db.add(
            ClientDocument(
                user_id=user.id,
                doc_type="CLIENT_SELFIE",
                file_name=selfie_name,
                content_type=selfie_type,
                storage_path=selfie_path,
                status="UPLOADED",
            )
        )

        license_encoding = _face_encoding_from_path(license_path)
        if license_encoding is None:
            raise HTTPException(
                status_code=422,
                detail="license_face_not_detected_retry_with_clear_license_photo",
            )

        selfie_encoding = _face_encoding_from_path(selfie_path)
        if selfie_encoding is None:
            raise HTTPException(
                status_code=422,
                detail="camera_required_for_verification_use_device_with_camera",
            )

        face_distance = float(
            face_recognition.face_distance([license_encoding], selfie_encoding)[0]
        )

        similarity_score = max(0.0, min(100.0, round((1.0 - face_distance) * 100.0, 2)))

        # Regla pedida:
        # >= 75 + movement_passed => acceso provisional
        # < 75 => sigue pendiente
        provisional_access = bool(movement_passed and similarity_score >= 75.0)

        verification = (
            db.query(ClientFaceVerification)
            .filter(ClientFaceVerification.user_id == user.id)
            .first()
        )

        if not verification:
            verification = ClientFaceVerification(user_id=user.id)
            db.add(verification)

        verification.movement_passed = bool(movement_passed)
        verification.similarity_score = similarity_score
        verification.face_distance = face_distance
        verification.provisional_access = provisional_access
        verification.admin_review_status = "PENDING"

        if provisional_access:
            verification.notes = "AUTO_PASS_CAN_LOGIN_POST_BUT_HIDDEN_UNTIL_ADMIN_APPROVES"
        else:
            verification.notes = "MANUAL_REVIEW_REQUIRED"

        # Mantener cliente en PENDING hasta aprobación admin
        # El acceso provisional lo controla core/deps.py con provisional_access = True
        user.status = "PENDING"

        db.commit()
        db.refresh(verification)
        db.refresh(user)

        return {
            "status": "OK",
            "movement_passed": bool(movement_passed),
            "face_distance": round(face_distance, 4),
            "similarity_score": similarity_score,
            "provisional_access": provisional_access,
            "admin_review_status": "PENDING",
            "can_login": provisional_access,
            "can_post_loads": provisional_access,
            "loads_visible_to_carriers": False,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"client_verification_failed: {str(e)}"
        )
@router.delete("/rollback")
def rollback_client_registration(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_kyc),
):
    if user.role != "client":
        raise HTTPException(status_code=403, detail="client_only")

    # solo permitir rollback si todavía está pendiente
    if user.status != "PENDING":
        raise HTTPException(status_code=400, detail="rollback_not_allowed")

    docs = db.query(ClientDocument).filter(ClientDocument.user_id == user.id).all()
    for d in docs:
        if d.storage_path and os.path.exists(d.storage_path):
            try:
                os.remove(d.storage_path)
            except Exception:
                pass
        db.delete(d)

    verification = (
        db.query(ClientFaceVerification)
        .filter(ClientFaceVerification.user_id == user.id)
        .first()
    )
    if verification:
        db.delete(verification)

    db.delete(user)
    db.commit()

    return {"status": "ROLLED_BACK"}
