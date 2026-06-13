from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.deps import get_db
from core.roles import require_roles

router = APIRouter()

@router.post("/reset")
def reset_system(db: Session = Depends(get_db), user=Depends(require_roles("admin"))):
    db.execute(text("TRUNCATE TABLE media_assets, inspections, loads, trucks, drivers, users CASCADE"))
    db.commit()
    return {"status": "SYSTEM_PURGED"}
