from sqlalchemy import Column, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db.base import Base

class CompanyReview(Base):
    __tablename__ = "company_reviews"
    id = Column(UUID(as_uuid=True), primary_key=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id"))
    reviewer_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    stars = Column(Integer, nullable=False)
    comment = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
