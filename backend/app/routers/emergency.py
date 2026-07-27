from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import EmergencyRequest, Hospital
from app.schemas import ApiResponse, EmergencyCreate, EmergencyRead, EmergencyResponseCreate

router = APIRouter(prefix="/emergency", tags=["Emergency"])


def serialize_emergency(request: EmergencyRequest) -> EmergencyRead:
    return EmergencyRead(
        requesting_hospital_id=request.requesting_hospital_id,
        blood_group=request.blood_group,
        component=request.component,
        units_needed=request.units_needed,
        priority=request.priority,
        patient_context=request.patient_context,
        id=request.id,
        status=request.status,
        responses=request.responses_json,
        created_at=request.created_at,
        resolved_at=request.resolved_at,
    )


@router.post("", response_model=ApiResponse[EmergencyRead], status_code=status.HTTP_201_CREATED)
def create_emergency(payload: EmergencyCreate, session: Session = Depends(get_session)) -> ApiResponse[EmergencyRead]:
    if not session.get(Hospital, payload.requesting_hospital_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requesting hospital not found")
    request = EmergencyRequest(**payload.model_dump())
    session.add(request)
    session.commit()
    session.refresh(request)
    return ApiResponse(data=serialize_emergency(request), message="Emergency broadcast sent")


@router.get("/active", response_model=ApiResponse[list[EmergencyRead]])
def active_emergencies(session: Session = Depends(get_session)) -> ApiResponse[list[EmergencyRead]]:
    requests = session.exec(
        select(EmergencyRequest)
        .where(EmergencyRequest.status == "ACTIVE")
        .order_by(EmergencyRequest.created_at.desc())
    ).all()
    return ApiResponse(data=[serialize_emergency(request) for request in requests])


@router.put("/{request_id}/respond", response_model=ApiResponse[EmergencyRead])
def respond_to_emergency(
    request_id: UUID,
    payload: EmergencyResponseCreate,
    session: Session = Depends(get_session),
) -> ApiResponse[EmergencyRead]:
    request = session.get(EmergencyRequest, request_id)
    if not request or request.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active emergency request not found")
    hospital = session.get(Hospital, payload.responding_hospital_id)
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responding hospital not found")
    responses = list(request.responses_json)
    responses.append(
        {
            "hospital_id": str(hospital.id),
            "hospital_name": hospital.name,
            "units_available": payload.units_available,
            "note": payload.note,
            "responded_at": datetime.utcnow().isoformat(),
        }
    )
    request.responses_json = responses
    session.add(request)
    session.commit()
    session.refresh(request)
    return ApiResponse(data=serialize_emergency(request), message="Emergency response recorded")
