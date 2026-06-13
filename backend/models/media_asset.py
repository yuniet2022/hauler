from sqlalchemy import Column, String, JSON, DateTime
from datetime import datetime
from db.base import Base

class MediaAssetDB(Base):
    __tablename__ = "media_assets"
    id = Column(String, primary_key=True)
    inspection_id = Column(String)
    type = Column(String)  # video|photo
    key = Column(String)
    url = Column(String)
    meta = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
