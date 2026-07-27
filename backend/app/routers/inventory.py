from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import BloodInventory, Hospital
from app.schemas import ApiResponse, InventoryCreate, InventoryRead, InventoryUpdate

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def serialize_inventory(item: BloodInventory) -> InventoryRead:
    days_until_expiry = (item.expiry_date - date.today()).days
    available = item.units_available - item.units_reserved
    inventory_status = "CRITICAL" if available < 5 else "LOW" if available < 20 else "SUFFICIENT"
    return InventoryRead(
        **item.model_dump(),
        units_total=item.units_available + item.units_reserved,
        status=inventory_status,
        days_until_expiry=days_until_expiry,
    )


@router.get("", response_model=ApiResponse[list[InventoryRead]])
def list_inventory(session: Session = Depends(get_session)) -> ApiResponse[list[InventoryRead]]:
    inventory = session.exec(select(BloodInventory)).all()
    return ApiResponse(data=[serialize_inventory(item) for item in inventory])


@router.get("/{hospital_id}", response_model=ApiResponse[list[InventoryRead]])
def get_hospital_inventory(hospital_id: UUID, session: Session = Depends(get_session)) -> ApiResponse[list[InventoryRead]]:
    if not session.get(Hospital, hospital_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")
    inventory = session.exec(select(BloodInventory).where(BloodInventory.hospital_id == hospital_id)).all()
    return ApiResponse(data=[serialize_inventory(item) for item in inventory])


@router.post("", response_model=ApiResponse[InventoryRead], status_code=status.HTTP_201_CREATED)
def create_inventory(payload: InventoryCreate, session: Session = Depends(get_session)) -> ApiResponse[InventoryRead]:
    if not session.get(Hospital, payload.hospital_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")
    item = BloodInventory(**payload.model_dump())
    session.add(item)
    session.commit()
    session.refresh(item)
    return ApiResponse(data=serialize_inventory(item), message="Inventory unit created")


@router.put("/{inventory_id}", response_model=ApiResponse[InventoryRead])
def update_inventory(
    inventory_id: UUID,
    payload: InventoryUpdate,
    session: Session = Depends(get_session),
) -> ApiResponse[InventoryRead]:
    item = session.get(BloodInventory, inventory_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field_name, value)
    item.last_updated = datetime.utcnow()
    session.add(item)
    session.commit()
    session.refresh(item)
    return ApiResponse(data=serialize_inventory(item), message="Inventory updated")
