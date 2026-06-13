from sqlalchemy import Column, String, JSON, DateTime
from datetime import datetime
from db.base import Base

class InspectionDB(Base):
    __tablename__ = "inspections"
    id = Column(String, primary_key=True)
    load_id = Column(String)
    created_by = Column(String)
    status = Column(String, default="PENDING")
    vehicle_snapshot = Column(JSON, default=dict)
    ai_result = Column(JSON, default=dict)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
