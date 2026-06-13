from sqlalchemy import Column, String, Date
from db.base import Base

class DriverDB(Base):
    __tablename__ = "drivers"

    id = Column(String(20), primary_key=True, index=True)
    owner_id = Column(String(36), index=True, nullable=False)   # carrier owner
    user_id = Column(String(36), index=True, unique=True)       # linked users.id as string

    name = Column(String)
    email = Column(String)
    phone = Column(String)

    license_number = Column(String)
    license_expiration = Column(Date)

    status = Column(String, default="AVAILABLE")
