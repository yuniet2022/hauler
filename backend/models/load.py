from sqlalchemy import Column, Text, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from db.base import Base

class Load(Base):
    __tablename__ = "loads"
    id = Column(UUID(as_uuid=True), primary_key=True)

    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    origin = Column(Text, nullable=False)
    destination = Column(Text, nullable=False)

    origin_obj = Column(JSONB)
    destination_obj = Column(JSONB)

    vehicle_info = Column(JSONB, nullable=False)
    target_price = Column(Numeric(10,2), nullable=False)

    route_summary = Column(JSONB, nullable=False)

    status = Column(Text, nullable=False) # PUBLISHED/ASSIGNED/CANCELLED
    assigned_company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class LoadOffer(Base):
    __tablename__ = "load_offers"
    id = Column(UUID(as_uuid=True), primary_key=True)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)

    offer_price = Column(Numeric(10,2), nullable=False)
    message = Column(Text)

    status = Column(Text, nullable=False) # PENDING/ACCEPTED/REJECTED/CANCELLED

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
