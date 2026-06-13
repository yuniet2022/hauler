# routes/client_requests.py
import uuid
from typing import Optional, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user
from models.load import Load

router = APIRouter(tags=["client-requests"])


def safe_float(x, default=None):
    try:
        if x is None:
            return default
        return float(x)
    except Exception:
        return default


def build_vehicle_info(req: dict) -> dict:
    year = req.get("vehicle_year")
    make = (req.get("vehicle_make") or "").strip()
    model = (req.get("vehicle_model") or "").strip()
    vin = (req.get("vin") or None)

    y = None
    try:
        if year is not None and str(year).strip().isdigit():
            y = int(str(year).strip())
    except Exception:
        y = None

    parts = [p for p in [str(y or ""), make, model] if p]
    text = " ".join(parts).strip() or "Vehicle"

    return {"year": y, "make": make or None, "model": model or None, "vin": vin, "text": text}


def build_route_summary(req: dict) -> dict:
    """
    DB exige route_summary NOT NULL.
    Acepta:
      - route_summary directo
      - routing + eta
      - metadata_json.client_side.eta
    """
    if isinstance(req.get("route_summary"), dict) and req.get("route_summary"):
        return req["route_summary"]

    routing = req.get("routing") or {}
    eta = req.get("eta") or {}

    meta = req.get("metadata_json") or req.get("metadata") or {}
    if isinstance(meta, dict):
        cs = meta.get("client_side") or {}
        if isinstance(cs, dict):
            eta2 = cs.get("eta")
            if isinstance(eta2, dict) and (not isinstance(eta, dict) or not eta):
                eta = eta2

    if not isinstance(eta, dict):
        eta = {}

    return {
        "profile_used": routing.get("profile_used") or routing.get("profile") or req.get("profile"),
        "distance_miles": safe_float(routing.get("distance_miles"), None),
        "distance_meters": safe_float(routing.get("distance_meters"), None),
        "duration_seconds": safe_float(routing.get("duration_seconds"), None),
        "eta": eta,
        "provider": routing.get("provider") or routing.get("source") or "openrouteservice",
    }


def serialize_load(l: Load) -> dict:
    rs = l.route_summary or {}
    # Backward-compat: front viejo espera metadata_json.routing/eta
    metadata_json = {
        "routing": {
            "profile_used": rs.get("profile_used"),
            "distance_miles": rs.get("distance_miles"),
            "distance_meters": rs.get("distance_meters"),
            "duration_seconds": rs.get("duration_seconds"),
            "provider": rs.get("provider"),
        },
        "eta": rs.get("eta") or {},
    }

    target_price = float(l.target_price) if l.target_price is not None else None

    return {
        "id": str(l.id),
        "owner_user_id": str(l.owner_user_id),
        "origin": l.origin,
        "destination": l.destination,
        "origin_obj": l.origin_obj or {},
        "destination_obj": l.destination_obj or {},
        "vehicle_info": l.vehicle_info or {},
        "target_price": target_price,
        "route_summary": rs,

        # Backward-compat fields:
        "price": target_price,
        "owner_id": str(l.owner_user_id),
        "metadata_json": metadata_json,

        "status": l.status,
        "assigned_company_id": str(l.assigned_company_id) if l.assigned_company_id else None,
        "created_at": l.created_at,
        "updated_at": l.updated_at,
    }


@router.get("/client-requests")
def get_requests(
    owner_user_id: Optional[str] = Query(default=None),
    assigned_company_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    ctx=Depends(get_current_user),
):
    user, cu, company, sub = ctx
    q = db.query(Load)

    if user.role == "admin":
        if owner_user_id:
            q = q.filter(Load.owner_user_id == owner_user_id)
        if assigned_company_id:
            q = q.filter(Load.assigned_company_id == assigned_company_id)
        return [serialize_load(x) for x in q.order_by(Load.created_at.desc()).all()]

    if user.role in ("client", "dealer"):
        q = q.filter(Load.owner_user_id == user.id)
        return [serialize_load(x) for x in q.order_by(Load.created_at.desc()).all()]

    if user.role == "carrier":
        if not company:
            return []
        q = q.filter(Load.assigned_company_id == company.id)
        return [serialize_load(x) for x in q.order_by(Load.created_at.desc()).all()]

    return []


@router.post("/client-requests")
def create_request(
    req: dict,
    db: Session = Depends(get_db),
    ctx=Depends(get_current_user),
):
    user, cu, company, sub = ctx

    origin = (req.get("origin") or "").strip()
    destination = (req.get("destination") or "").strip()
    target_price = safe_float(req.get("target_price"), None)

    if not origin or not destination:
        raise HTTPException(status_code=422, detail="origin_and_destination_required")
    if target_price is None:
        raise HTTPException(status_code=422, detail="target_price_required")

    route_summary = build_route_summary(req)
    if not route_summary:
        route_summary = {"profile_used": req.get("profile"), "eta": {}, "provider": "openrouteservice"}

    new_load = Load(
        id=uuid.uuid4(),
        owner_user_id=user.id,
        origin=origin,
        destination=destination,
        origin_obj=req.get("origin_obj"),
        destination_obj=req.get("destination_obj"),
        vehicle_info=build_vehicle_info(req),
        target_price=target_price,
        route_summary=route_summary,
        status="PUBLISHED",
        assigned_company_id=None,
    )

    db.add(new_load)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"db_commit_failed: {str(e)}")

    db.refresh(new_load)
    return serialize_load(new_load)


@router.put("/client-requests/{load_id}/assign")
def assign_company(
    load_id: str,
    data: dict,
    db: Session = Depends(get_db),
    ctx=Depends(get_current_user),
):
    user, cu, company, sub = ctx

    company_id = (data.get("company_id") or "").strip()
    if not company_id:
        raise HTTPException(status_code=422, detail="company_id_required")

    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="load_not_found")

    if user.role != "admin" and str(load.owner_user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="FORBIDDEN")

    load.assigned_company_id = company_id
    load.status = "ASSIGNED"
    db.commit()
    db.refresh(load)
    return serialize_load(load)
