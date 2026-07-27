from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Hospital
from app.schemas import ApiResponse, HospitalCreate, HospitalRead

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


def serialize_hospital(hospital: Hospital) -> HospitalRead:
    return HospitalRead.model_validate(hospital, from_attributes=True)


@router.get("", response_model=ApiResponse[list[HospitalRead]])
def list_hospitals(session: Session = Depends(get_session)) -> ApiResponse[list[HospitalRead]]:
    hospitals = session.exec(select(Hospital).where(Hospital.is_active.is_(True))).all()
    return ApiResponse(data=[serialize_hospital(hospital) for hospital in hospitals])


@router.post("", response_model=ApiResponse[HospitalRead], status_code=status.HTTP_201_CREATED)
def create_hospital(payload: HospitalCreate, session: Session = Depends(get_session)) -> ApiResponse[HospitalRead]:
    if session.exec(select(Hospital).where(Hospital.code == payload.code)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Hospital code already exists")
    hospital = Hospital(**payload.model_dump())
    session.add(hospital)
    session.commit()
    session.refresh(hospital)
    return ApiResponse(data=serialize_hospital(hospital), message="Hospital created")


@router.get("/{hospital_id}", response_model=ApiResponse[HospitalRead])
def get_hospital(hospital_id: UUID, session: Session = Depends(get_session)) -> ApiResponse[HospitalRead]:
    hospital = session.get(Hospital, hospital_id)
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")
    return ApiResponse(data=serialize_hospital(hospital))
