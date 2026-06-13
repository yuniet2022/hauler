import uuid

from sqlalchemy import Column, Text, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from db.base import Base


class ClientFaceVerification(Base):
    __tablename__ = "client_face_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)

    movement_passed = Column(Boolean, nullable=False, default=False)
    similarity_score = Column(Float, nullable=False, default=0)
    face_distance = Column(Float, nullable=False, default=1)

    provisional_access = Column(Boolean, nullable=False, default=False)
    admin_review_status = Column(Text, nullable=False, default="PENDING")  # PENDING/APPROVED/REJECTED
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
