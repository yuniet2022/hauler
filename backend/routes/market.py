from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.deps import get_db, require_company
from models.load import Load

router = APIRouter(tags=["market"])  # ✅ SIN prefix aquí

@router.get("/market-loads")
def market_loads(db: Session = Depends(get_db), ctx=Depends(require_company)):
    loads = (
        db.query(Load)
        .filter(Load.status == "PUBLISHED")
        .order_by(Load.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(l.id),
            "origin": l.origin,
            "destination": l.destination,
            "target_price": float(l.target_price) if l.target_price is not None else 0,
            "vehicle_info": l.vehicle_info,
            "route_summary": l.route_summary,
            "status": l.status,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in loads
    ]
