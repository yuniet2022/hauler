from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_type = Column(Text, nullable=False)  # DEALER/CARRIER/TOW
    legal_name = Column(Text, nullable=False)
    display_name = Column(Text, nullable=False)
    name_key = Column(Text, nullable=False)

    state = Column(Text, nullable=False)
    city = Column(Text)
    address1 = Column(Text)
    address2 = Column(Text)
    zip = Column(Text)
    phone = Column(Text)

    dot_number = Column(Text)
    mc_number = Column(Text)

    approval_status = Column(Text, nullable=False)  # PENDING/APPROVED/REJECTED
    status = Column(Text, nullable=False)           # ACTIVE/CLOSED

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CompanyUser(Base):
    __tablename__ = "company_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    role_in_company = Column(Text, nullable=False)  # OWNER/MANAGER/STAFF
    status = Column(Text, nullable=False)           # ACTIVE/DISABLED

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
