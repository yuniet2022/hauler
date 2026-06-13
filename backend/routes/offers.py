from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime

from core.deps import get_db, require_company, require_client
from models.load import Load, LoadOffer
from models.company import Company
from schemas.load import OfferRequest

router = APIRouter(prefix="/api", tags=["offers"])

@router.post("/loads/{load_id}/offer")
def place_offer(load_id: str, payload: OfferRequest, db: Session = Depends(get_db), ctx=Depends(require_company)):
    user, cu, company, sub = ctx

    load = db.query(Load).filter(Load.id == load_id).first()
    if not load or load.status != "PUBLISHED":
        raise HTTPException(status_code=404, detail="load_not_found_or_not_published")

    # prevent duplicates pending offers
    existing = db.query(LoadOffer).filter(
        and_(LoadOffer.load_id == load.id, LoadOffer.company_id == company.id, LoadOffer.status == "PENDING")
    ).first()
    if existing:
        # update it
        existing.offer_price = payload.offer_price
        existing.message = payload.message
        existing.updated_at = datetime.utcnow()
        db.commit()
        return {"status": "OFFER_UPDATED"}

    offer = LoadOffer(
        load_id=load.id,
        company_id=company.id,
        offer_price=payload.offer_price,
        message=payload.message,
        status="PENDING",
    )
    db.add(offer)
    db.commit()
    return {"status": "OFFER_SENT"}

@router.get("/client/loads")
def client_loads(db: Session = Depends(get_db), ctx=Depends(require_client)):
    user, cu, company, sub = ctx

    loads = db.query(Load).filter(Load.owner_user_id == user.id).order_by(Load.created_at.desc()).all()
    out = []
    for l in loads:
        offers = db.query(LoadOffer).filter(LoadOffer.load_id == l.id).order_by(LoadOffer.created_at.desc()).all()
        offers_out = []
        for o in offers:
            comp = db.query(Company).filter(Company.id == o.company_id).first()
            offers_out.append({
                "company": {
                    "id": str(comp.id),
                    "type": comp.company_type,
                    "display_name": comp.display_name,
                    "phone": comp.phone,
                    "address1": comp.address1,
                    "city": comp.city,
                    "state": comp.state,
                } if comp else None,
                "offer_price": float(o.offer_price),
                "message": o.message,
                "status": o.status,
                "created_at": o.created_at,
            })

        out.append({
            "id": str(l.id),
            "origin": l.origin,
            "destination": l.destination,
            "target_price": float(l.target_price),
            "vehicle_info": l.vehicle_info,
            "route_summary": l.route_summary,
            "status": l.status,
            "offers": offers_out,
            "created_at": l.created_at,
        })
    return out

@router.post("/loads/{load_id}/offers/{company_id}/accept")
def accept_offer(load_id: str, company_id: str, db: Session = Depends(get_db), ctx=Depends(require_client)):
    user, cu, company, sub = ctx

    load = db.query(Load).filter(Load.id == load_id, Load.owner_user_id == user.id).first()
    if not load:
        raise HTTPException(status_code=404, detail="load_not_found")
    if load.status != "PUBLISHED":
        raise HTTPException(status_code=400, detail="load_not_publishable")

    offer = db.query(LoadOffer).filter(
        LoadOffer.load_id == load.id,
        LoadOffer.company_id == company_id,
        LoadOffer.status == "PENDING"
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="offer_not_found")

    # Accept: assign to company, close market visibility
    load.status = "ASSIGNED"
    load.assigned_company_id = offer.company_id
    load.updated_at = datetime.utcnow()

    offer.status = "ACCEPTED"
    offer.updated_at = datetime.utcnow()

    # reject all other pending offers
    others = db.query(LoadOffer).filter(
        LoadOffer.load_id == load.id,
        LoadOffer.status == "PENDING",
        LoadOffer.company_id != offer.company_id
    ).all()
    for o in others:
        o.status = "REJECTED"
        o.updated_at = datetime.utcnow()

    db.commit()
    return {"status": "ACCEPTED", "assigned_company_id": str(load.assigned_company_id)}

@router.post("/loads/{load_id}/offers/{company_id}/reject")
def reject_offer(load_id: str, company_id: str, db: Session = Depends(get_db), ctx=Depends(require_client)):
    user, cu, company, sub = ctx

    load = db.query(Load).filter(Load.id == load_id, Load.owner_user_id == user.id).first()
    if not load:
        raise HTTPException(status_code=404, detail="load_not_found")

    offer = db.query(LoadOffer).filter(
        LoadOffer.load_id == load.id,
        LoadOffer.company_id == company_id,
        LoadOffer.status == "PENDING"
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="offer_not_found")

    offer.status = "REJECTED"
    offer.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "REJECTED"}

@router.get("/company/my-loads")
def company_my_loads(db: Session = Depends(get_db), ctx=Depends(require_company)):
    user, cu, company, sub = ctx
    loads = db.query(Load).filter(Load.assigned_company_id == company.id, Load.status == "ASSIGNED").order_by(Load.created_at.desc()).all()
    return [{
        "id": str(l.id),
        "origin": l.origin,
        "destination": l.destination,
        "target_price": float(l.target_price),
        "vehicle_info": l.vehicle_info,
        "route_summary": l.route_summary,
        "status": l.status,
        "created_at": l.created_at,
    } for l in loads]
