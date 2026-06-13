# routes/inspections.py
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user_kyc
from core.queue import get_queue
from core.spaces import spaces_ready, spaces_public_url
from core.config import settings
from jobs.inspection_jobs import run_inspection_analysis
from models.inspection import InspectionDB
from models.media_asset import MediaAssetDB

router = APIRouter(prefix="/api", tags=["inspections"])

@router.post("/inspections")
def create_inspection(payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user_kyc)):
    insp = InspectionDB(
        id=str(uuid.uuid4()),
        load_id=payload.get("load_id"),
        created_by=str(user.id),
        status="PENDING",
        vehicle_snapshot=payload.get("vehicle_snapshot") or payload.get("vehicle_info") or {},
        metadata_json=payload.get("metadata_json") or {},
        ai_result={},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(insp)
    db.commit()
    return {"inspection_id": insp.id, "status": insp.status}

@router.post("/inspections/{inspection_id}/presign")
def presign_uploads(inspection_id: str, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user_kyc)):
    insp = db.query(InspectionDB).filter(InspectionDB.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="inspection_not_found")
    if str(insp.created_by) != str(user.id):
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    if not spaces_ready():
        raise HTTPException(status_code=500, detail="SPACES_NOT_CONFIGURED")

    files = payload.get("files") or []
    if not isinstance(files, list) or not files:
        raise HTTPException(status_code=422, detail="files_required")

    import boto3
    s3 = boto3.client(
        "s3",
        endpoint_url=settings.spaces_endpoint,
        aws_access_key_id=settings.spaces_key,
        aws_secret_access_key=settings.spaces_secret,
        region_name=settings.spaces_region or None,
    )

    uploads = []
    for f in files:
        ftype = (f.get("type") or "").strip().lower()
        kind = (f.get("kind") or "").strip().upper()
        filename = (f.get("filename") or "file.bin").strip()
        content_type = (f.get("content_type") or "application/octet-stream").strip()

        if ftype not in ("video", "photo"):
            raise HTTPException(status_code=422, detail="invalid_file_type")

        safe_name = filename.replace("..", "").replace("/", "_").replace("\\", "_")
        key = f"kyc/{user.id}/{inspection_id}/{uuid.uuid4().hex}_{kind}_{safe_name}"

        put_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={"Bucket": settings.spaces_bucket, "Key": key, "ContentType": content_type},
            ExpiresIn=900,
        )

        uploads.append({"key": key, "url": put_url, "public_url": spaces_public_url(key), "kind": kind})

    insp.status = "UPLOADING"
    insp.updated_at = datetime.utcnow()
    db.commit()
    return {"uploads": uploads}

@router.post("/inspections/{inspection_id}/media")
def register_media(inspection_id: str, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user_kyc)):
    insp = db.query(InspectionDB).filter(InspectionDB.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="inspection_not_found")
    if str(insp.created_by) != str(user.id):
        raise HTTPException(status_code=403, detail="FORBIDDEN")

    mtype = (payload.get("type") or "").strip().lower()
    key = (payload.get("key") or "").strip()
    url = (payload.get("url") or "").strip() or spaces_public_url(key)
    meta = payload.get("meta") or {}

    if mtype not in ("video", "photo") or not key:
        raise HTTPException(status_code=422, detail="invalid_media_payload")

    m = MediaAssetDB(
        id=str(uuid.uuid4()),
        inspection_id=inspection_id,
        type=mtype,
        key=key,
        url=url,
        meta=meta,
        created_at=datetime.utcnow(),
    )
    db.add(m)
    insp.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "MEDIA_REGISTERED", "media_id": m.id}

@router.get("/inspections/{inspection_id}")
def get_inspection(inspection_id: str, db: Session = Depends(get_db), user=Depends(get_current_user_kyc)):
    insp = db.query(InspectionDB).filter(InspectionDB.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="inspection_not_found")
    if str(insp.created_by) != str(user.id):
        raise HTTPException(status_code=403, detail="FORBIDDEN")

    media = db.query(MediaAssetDB).filter(MediaAssetDB.inspection_id == inspection_id).all()
    return {
        "id": insp.id,
        "created_by": insp.created_by,
        "status": insp.status,
        "metadata_json": insp.metadata_json or {},
        "created_at": insp.created_at.isoformat() if insp.created_at else None,
        "updated_at": insp.updated_at.isoformat() if insp.updated_at else None,
        "media": [
            {"id": m.id, "type": m.type, "key": m.key, "url": m.url, "meta": m.meta or {}, "created_at": m.created_at.isoformat() if m.created_at else None}
            for m in media
        ],
    }

@router.post("/inspections/{inspection_id}/signed-view")
def signed_view(inspection_id: str, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user_kyc)):
    insp = db.query(InspectionDB).filter(InspectionDB.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="inspection_not_found")
    if str(insp.created_by) != str(user.id):
        raise HTTPException(status_code=403, detail="FORBIDDEN")

    key = (payload.get("key") or "").strip()
    if not key:
        raise HTTPException(status_code=422, detail="key_required")
    if not spaces_ready():
        raise HTTPException(status_code=500, detail="SPACES_NOT_CONFIGURED")

    import boto3
    s3 = boto3.client(
        "s3",
        endpoint_url=settings.spaces_endpoint,
        aws_access_key_id=settings.spaces_key,
        aws_secret_access_key=settings.spaces_secret,
        region_name=settings.spaces_region or None,
    )

    get_url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": settings.spaces_bucket, "Key": key},
        ExpiresIn=600,
    )
    return {"url": get_url}

@router.post("/inspections/{inspection_id}/analyze")
def analyze_inspection(
    inspection_id: str,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_kyc),
):
    insp = db.query(InspectionDB).filter(InspectionDB.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="inspection_not_found")
    if str(insp.created_by) != str(user.id):
        raise HTTPException(status_code=403, detail="FORBIDDEN")

    q = get_queue()
    if q is not None:
        job = q.enqueue(run_inspection_analysis, inspection_id)
        insp.status = "QUEUED"
        insp.updated_at = datetime.utcnow()
        db.commit()
        return {"status": "QUEUED", "job_id": job.id}

    insp.status = "PROCESSING"
    insp.updated_at = datetime.utcnow()
    db.commit()
    background.add_task(run_inspection_analysis, inspection_id)
    return {"status": "PROCESSING"}
