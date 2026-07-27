from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import BloodInventory, Hospital, RedistributionRequest, RequestStatus
from app.schemas import ApiResponse, RedistributionCreate, RedistributionRead

router = APIRouter(prefix="/redistribution", tags=["Redistribution"])


def serialize_request(request: RedistributionRequest) -> RedistributionRead:
    return RedistributionRead.model_validate(request, from_attributes=True)


@router.get("", response_model=ApiResponse[list[RedistributionRead]])
def list_requests(session: Session = Depends(get_session)) -> ApiResponse[list[RedistributionRead]]:
    requests = session.exec(select(RedistributionRequest).order_by(RedistributionRequest.created_at.desc())).all()
    return ApiResponse(data=[serialize_request(request) for request in requests])


@router.post("", response_model=ApiResponse[RedistributionRead], status_code=status.HTTP_201_CREATED)
def create_request(payload: RedistributionCreate, session: Session = Depends(get_session)) -> ApiResponse[RedistributionRead]:
    if payload.source_hospital_id == payload.target_hospital_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Source and target hospitals must differ")
    if not session.get(Hospital, payload.source_hospital_id) or not session.get(Hospital, payload.target_hospital_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source or target hospital not found")
    request = RedistributionRequest(**payload.model_dump())
    session.add(request)
    session.commit()
    session.refresh(request)
    return ApiResponse(data=serialize_request(request), message="Redistribution request created")


@router.put("/{request_id}/approve", response_model=ApiResponse[RedistributionRead])
def approve_request(request_id: UUID, session: Session = Depends(get_session)) -> ApiResponse[RedistributionRead]:
    request = session.get(RedistributionRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Redistribution request not found")
    if request.status != RequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending requests can be approved")
    inventory = session.exec(
        select(BloodInventory).where(
            BloodInventory.hospital_id == request.source_hospital_id,
            BloodInventory.blood_group == request.blood_group,
            BloodInventory.component == request.component,
        )
    ).first()
    if not inventory or inventory.units_available < request.units:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Insufficient source inventory")
    inventory.units_available -= request.units
    inventory.last_updated = datetime.utcnow()
    request.status = RequestStatus.APPROVED
    request.approved_at = datetime.utcnow()
    request.updated_at = datetime.utcnow()
    session.add(inventory)
    session.add(request)
    session.commit()
    session.refresh(request)
    return ApiResponse(data=serialize_request(request), message="Transfer approved successfully")
