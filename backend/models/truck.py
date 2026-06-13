from sqlalchemy import Column, String
from db.base import Base

class TruckDB(Base):
    __tablename__ = "trucks"
    id = Column(String, primary_key=True)
    owner_id = Column(String)
    name = Column(String)
    vin = Column(String)
    plate = Column(String)
    status = Column(String, default="READY")
