from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import AIPrediction, Hospital, RiskLevel
from app.schemas import ApiResponse, PredictionExplanation, PredictionRead
from app.services.ai_engine import generate_redistribution_recommendations, refresh_all_predictions

router = APIRouter(prefix="/predictions", tags=["AI Predictions"])


def serialize_prediction(prediction: AIPrediction) -> PredictionRead:
    return PredictionRead(
        id=prediction.id,
        hospital_id=prediction.hospital_id,
        blood_group=prediction.blood_group,
        component=prediction.component,
        predicted_shortage_units=prediction.predicted_shortage_units,
        predicted_demand_next_7d=prediction.predicted_demand_next_7d or 0,
        predicted_demand_next_30d=prediction.predicted_demand_next_30d or 0,
        risk_score=prediction.risk_score,
        risk_level=prediction.risk_level,
        confidence_score=prediction.confidence_score,
        explanation=PredictionExplanation.model_validate(prediction.explanation_json),
        created_at=prediction.created_at,
    )


@router.get("/{hospital_id}", response_model=ApiResponse[list[PredictionRead]])
def get_predictions(hospital_id: UUID, session: Session = Depends(get_session)) -> ApiResponse[list[PredictionRead]]:
    if not session.get(Hospital, hospital_id):
        raise HTTPException(status_code=404, detail="Hospital not found")
    predictions = session.exec(
        select(AIPrediction)
        .where(AIPrediction.hospital_id == hospital_id)
        .order_by(AIPrediction.created_at.desc())
    ).all()
    return ApiResponse(data=[serialize_prediction(prediction) for prediction in predictions])


@router.post("/refresh", response_model=ApiResponse[list[PredictionRead]])
def refresh_predictions(session: Session = Depends(get_session)) -> ApiResponse[list[PredictionRead]]:
    """Refresh all predictions using trained XGBoost models with explainable AI."""
    raw_results = refresh_all_predictions(session)
    predictions = session.exec(
        select(AIPrediction).order_by(AIPrediction.created_at.desc())
    ).all()
    return ApiResponse(data=[serialize_prediction(p) for p in predictions], message="Predictions refreshed with XGBoost inference")


@router.get("/feature-importance/global")
def feature_importance(hospital_id: UUID | None = None, blood_group: str | None = None, session: Session = Depends(get_session)):
    from app.services.ai_engine import get_feature_importance
    from app.models import BloodGroup
    bg = None
    if blood_group:
        try:
            bg = BloodGroup(blood_group)
        except ValueError:
            pass
    result = get_feature_importance(str(hospital_id) if hospital_id else None, bg)
    return ApiResponse(data=result)


@router.get("/redistribution/recommendations")
def redistribution_recommendations(session: Session = Depends(get_session)):
    recs = generate_redistribution_recommendations(session)
    return ApiResponse(data=recs, message=f"Generated {len(recs)} redistribution recommendations")
