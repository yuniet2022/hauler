from sqlalchemy import Column, Text, DateTime, Boolean, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from db.base import Base
import uuid

class Plan(Base):
    __tablename__ = "plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_type = Column(Text, nullable=False)      # DEALER/CARRIER/TOW
    code = Column(Text, nullable=False)              # BASIC/ADVANCED
    default_monthly_price = Column(Numeric(10,2), nullable=False)
    features_json = Column(JSONB, nullable=False)
    is_active = Column(Boolean, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class CompanySubscription(Base):
    __tablename__ = "company_subscriptions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, unique=True, index=True)

    plan_code = Column(Text, nullable=False)      # TRIAL/BASIC/ADVANCED
    status = Column(Text, nullable=False)         # TRIAL/ACTIVE/PAST_DUE/SUSPENDED

    trial_ends_at = Column(DateTime(timezone=True))
    current_period_start = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    current_period_end = Column(DateTime(timezone=True))

    price_override_monthly = Column(Numeric(10,2))
    price_effective_monthly = Column(Numeric(10,2), nullable=False)

    features_override_json = Column(JSONB)

    auto_disable_on_due = Column(Boolean, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
