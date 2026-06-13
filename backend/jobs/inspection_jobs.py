from datetime import datetime
from db.session import SessionLocal
from models.inspection import InspectionDB

def run_inspection_analysis(inspection_id: str) -> None:
    db = SessionLocal()
    try:
        insp = db.query(InspectionDB).filter(InspectionDB.id == inspection_id).first()
        if not insp:
            return

        insp.status = "PROCESSING"
        insp.updated_at = datetime.utcnow()
        db.commit()

        # TODO: Gemini later
        insp.ai_result = {"ok": True, "note": "Pipeline ready; Gemini not enabled yet."}
        insp.status = "DONE"
        insp.updated_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        try:
            insp = db.query(InspectionDB).filter(InspectionDB.id == inspection_id).first()
            if insp:
                insp.status = "FAILED"
                insp.ai_result = {"ok": False, "error": str(e)}
                insp.updated_at = datetime.utcnow()
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
