from datetime import date, datetime
from typing import Any, Generic, Optional, TypeVar
from uuid import UUID

from pydantic import EmailStr
from sqlmodel import Field, SQLModel

from app.models import BloodComponent, BloodGroup, RequestStatus, RiskLevel, UserRole

T = TypeVar("T")


class ApiResponse(SQLModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[dict[str, str]] = None


class HospitalCreate(SQLModel):
    name: str = Field(max_length=255)
    code: str = Field(max_length=50)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None


class HospitalRead(SQLModel):
    id: UUID
    name: str
    code: str
    city: Optional[str]
    state: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    is_active: bool


class InventoryCreate(SQLModel):
    hospital_id: UUID
    blood_group: BloodGroup
    component: BloodComponent
    units_available: int = Field(ge=0)
    units_reserved: int = Field(default=0, ge=0)
    expiry_date: date
    batch_id: Optional[str] = None
    donation_date: Optional[date] = None


class InventoryUpdate(SQLModel):
    units_available: Optional[int] = Field(default=None, ge=0)
    units_reserved: Optional[int] = Field(default=None, ge=0)
    expiry_date: Optional[date] = None
    batch_id: Optional[str] = None


class InventoryRead(InventoryCreate):
    id: UUID
    last_updated: datetime
    units_total: int
    status: str
    days_until_expiry: int


class PredictionExplanation(SQLModel):
    top_features: list[dict[str, Any]]
    summary: str


class PredictionRead(SQLModel):
    id: UUID
    hospital_id: UUID
    blood_group: BloodGroup
    component: BloodComponent
    predicted_shortage_units: Optional[int]
    predicted_demand_next_7d: int
    predicted_demand_next_30d: int
    risk_score: float
    risk_level: RiskLevel
    confidence_score: float
    explanation: PredictionExplanation
    created_at: datetime


class RedistributionCreate(SQLModel):
    source_hospital_id: UUID
    target_hospital_id: UUID
    blood_group: BloodGroup
    component: BloodComponent
    units: int = Field(gt=0)
    ai_confidence: Optional[float] = Field(default=None, ge=0, le=1)
    ai_reasoning: Optional[str] = None
    estimated_travel_time_mins: Optional[int] = None
    distance_km: Optional[float] = None


class RedistributionRead(RedistributionCreate):
    id: UUID
    status: RequestStatus
    created_at: datetime
    updated_at: datetime


class EmergencyCreate(SQLModel):
    requesting_hospital_id: UUID
    blood_group: BloodGroup
    component: BloodComponent
    units_needed: int = Field(gt=0)
    priority: str = "URGENT"
    patient_context: Optional[str] = None


class EmergencyResponseCreate(SQLModel):
    responding_hospital_id: UUID
    units_available: int = Field(gt=0)
    note: Optional[str] = None


class EmergencyRead(EmergencyCreate):
    id: UUID
    status: str
    responses: list[dict[str, Any]]
    created_at: datetime
    resolved_at: Optional[datetime]


class RegisterRequest(SQLModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    hospital_id: Optional[UUID] = None
    role: UserRole = UserRole.VIEWER


class LoginRequest(SQLModel):
    email: EmailStr
    password: str


class TokenRead(SQLModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(SQLModel):
    id: UUID
    email: EmailStr
    full_name: str
    hospital_id: Optional[UUID]
    role: UserRole

class UserCreate(SQLModel):
    email: str
    full_name: str
    password: str
    hospital_id: Optional[UUID] = None
    role: str = "VIEWER"

class UserLogin(SQLModel):
    email: str
    password: str

class UserResponse(SQLModel):
    id: UUID
    email: str
    full_name: str
    role: str

class TokenResponse(SQLModel):
    access_token: str
    token_type: str
