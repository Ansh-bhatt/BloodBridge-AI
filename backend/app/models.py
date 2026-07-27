from datetime import date as Date, datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, JSON, UniqueConstraint
from sqlmodel import Field, SQLModel


class BloodGroup(str, Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class BloodComponent(str, Enum):
    WHOLE_BLOOD = "Whole Blood"
    RBC = "RBC"
    PLATELETS = "Platelets"
    PLASMA = "Plasma"
    CRYO = "Cryoprecipitate"


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    IN_TRANSIT = "IN_TRANSIT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    BLOOD_BANK_MANAGER = "BLOOD_BANK_MANAGER"
    HOSPITAL_STAFF = "HOSPITAL_STAFF"
    VIEWER = "VIEWER"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Hospital(SQLModel, table=True):
    __tablename__ = "hospitals"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    code: str = Field(max_length=50, unique=True, index=True)
    address: Optional[str] = None
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_phone: Optional[str] = Field(default=None, max_length=20)
    contact_email: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class BloodInventory(SQLModel, table=True):
    __tablename__ = "blood_inventory"
    __table_args__ = (UniqueConstraint("hospital_id", "blood_group", "component", "batch_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hospital_id: UUID = Field(foreign_key="hospitals.id", index=True)
    blood_group: BloodGroup = Field(index=True)
    component: BloodComponent
    units_available: int = Field(default=0, ge=0)
    units_reserved: int = Field(default=0, ge=0)
    expiry_date: Date
    batch_id: Optional[str] = Field(default=None, max_length=100)
    donation_date: Optional[Date] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class HistoricalDemand(SQLModel, table=True):
    __tablename__ = "historical_demand"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hospital_id: UUID = Field(foreign_key="hospitals.id", index=True)
    blood_group: BloodGroup = Field(index=True)
    component: BloodComponent
    units_used: int = Field(gt=0)
    date: Date = Field(index=True)
    is_emergency: bool = Field(default=False)
    department: Optional[str] = Field(default=None, max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AIPrediction(SQLModel, table=True):
    __tablename__ = "ai_predictions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hospital_id: UUID = Field(foreign_key="hospitals.id", index=True)
    blood_group: BloodGroup = Field(index=True)
    component: BloodComponent
    prediction_date: Date
    predicted_shortage_units: Optional[int] = None
    predicted_demand_next_7d: Optional[int] = None
    predicted_demand_next_30d: Optional[int] = None
    risk_score: float = Field(ge=0, le=1, index=True)
    risk_level: RiskLevel
    confidence_score: float = Field(ge=0, le=1)
    explanation_json: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    model_version: str = Field(default="v1.0", max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RedistributionRequest(SQLModel, table=True):
    __tablename__ = "redistribution_requests"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    source_hospital_id: UUID = Field(foreign_key="hospitals.id", index=True)
    target_hospital_id: UUID = Field(foreign_key="hospitals.id", index=True)
    blood_group: BloodGroup
    component: BloodComponent
    units: int = Field(gt=0)
    status: RequestStatus = Field(default=RequestStatus.PENDING, index=True)
    ai_confidence: Optional[float] = Field(default=None, ge=0, le=1)
    ai_reasoning: Optional[str] = None
    estimated_travel_time_mins: Optional[int] = None
    distance_km: Optional[float] = None
    requested_by: Optional[UUID] = None
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    tracking_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hospital_id: Optional[UUID] = Field(default=None, foreign_key="hospitals.id", index=True)
    email: str = Field(max_length=255, unique=True, index=True)
    full_name: str = Field(max_length=255)
    hashed_password: str
    role: UserRole = Field(default=UserRole.VIEWER)
    phone: Optional[str] = Field(default=None, max_length=20)
    is_active: bool = Field(default=True)
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EmergencyRequest(SQLModel, table=True):
    __tablename__ = "emergency_requests"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    requesting_hospital_id: UUID = Field(foreign_key="hospitals.id", index=True)
    blood_group: BloodGroup
    component: BloodComponent
    units_needed: int = Field(gt=0)
    priority: str = Field(default="URGENT", max_length=20)
    status: str = Field(default="ACTIVE", max_length=20, index=True)
    patient_context: Optional[str] = None
    responses_json: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    fulfilled_by: Optional[UUID] = Field(default=None, foreign_key="hospitals.id")
    fulfilled_units: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
