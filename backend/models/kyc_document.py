import uuid

from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from db.base import Base


class KycDocument(Base):
    __tablename__ = "kyc_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    doc_type = Column(Text, nullable=False)        # OWNER_LICENSE / INSURANCE / AUTHORITY
    file_name = Column(Text, nullable=False)
    content_type = Column(Text)
    storage_path = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="UPLOADED")  # UPLOADED/VERIFIED/REJECTED

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
