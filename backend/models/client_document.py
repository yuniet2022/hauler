import uuid

from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from db.base import Base


class ClientDocument(Base):
    __tablename__ = "client_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    doc_type = Column(Text, nullable=False)   # CLIENT_LICENSE / CLIENT_SELFIE
    file_name = Column(Text, nullable=False)
    content_type = Column(Text)
    storage_path = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="UPLOADED")  # UPLOADED/VERIFIED/REJECTED

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
