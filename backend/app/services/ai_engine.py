from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sqlmodel import Session, select

from app.database import engine
from app.models import (
    AIPrediction,
    BloodGroup,
    BloodInventory,
    HistoricalDemand,
    Hospital,
    RiskLevel,
)
from app.services.feature_engineering import FEATURE_COLUMNS, create_features

MODELS_DIR = Path(__file__).resolve().parents[2] / "ml_models"

_blood_group_slug: dict[BloodGroup, str] = {
    BloodGroup.A_POS: "Apos",
    BloodGroup.A_NEG: "Aneg",
    BloodGroup.B_POS: "Bpos",
    BloodGroup.B_NEG: "Bneg",
    BloodGroup.AB_POS: "ABpos",
    BloodGroup.AB_NEG: "ABneg",
    BloodGroup.O_POS: "Opos",
    BloodGroup.O_NEG: "Oneg",
}

_model_cache: dict[str, Any] = {}


def _model_path(hospital_id: str, blood_group: BloodGroup) -> Path:
    slug = _blood_group_slug[blood_group]
    return MODELS_DIR / f"{hospital_id}_{slug}.joblib"


def _load_model(hospital_id: str, blood_group: BloodGroup) -> Any | None:
    cache_key = f"{hospital_id}_{_blood_group_slug[blood_group]}"
    if cache_key in _model_cache:
        return _model_cache[cache_key]
    path = _model_path(hospital_id, blood_group)
    if not path.exists():
        return None
    model = joblib.load(path)
    _model_cache[cache_key] = model
    return model


def _build_feature_frame(rows: list[HistoricalDemand], hospital_id: str, blood_group: BloodGroup) -> pd.DataFrame:
    records = []
    for row in rows:
        records.append(
            {
                "hospital_id": str(row.hospital_id),
                "blood_group": row.blood_group.value if isinstance(row.blood_group, BloodGroup) else row.blood_group,
                "date": row.date,
                "units_used": row.units_used,
            }
        )
    if not records:
        today = date.today()
        records = [
            {
                "hospital_id": hospital_id,
                "blood_group": blood_group.value,
                "date": today - timedelta(days=i),
                "units_used": 0,
            }
            for i in range(30, 0, -1)
        ]
    df = pd.DataFrame(records)
    df["hospital_id"] = hospital_id
    df["blood_group"] = blood_group.value
    return create_features(df)


def _make_explanation(feature_names: list[str], importances: np.ndarray, demand_7d: int, available: int, risk_score: float) -> dict[str, Any]:
    top_idx = np.argsort(importances)[::-1][:3]
    total_imp = float(importances.sum()) or 1.0
    top_features = []
    for idx in top_idx:
        imp = float(importances[idx])
        direction = "increase" if imp > 0 else "decrease"
        top_features.append(
            {
                "feature": feature_names[idx],
                "impact": round(imp / total_imp, 3),
                "direction": direction,
            }
        )
    if risk_score >= 0.7:
        severity = "critical"
        action = "immediately arrange redistribution or emergency procurement"
    elif risk_score >= 0.4:
        severity = "high"
        action = "prepare redistribution from surplus hospitals"
    elif risk_score >= 0.2:
        severity = "moderate"
        action = "monitor closely and pre-position emergency stock"
    else:
        severity = "low"
        action = "maintain current supply levels"
    summary = (
        f"7-day demand forecast is {demand_7d} units against {available} usable units in stock "
        f"(risk: {risk_score:.0%}, {severity}). Recommended action: {action}."
    )
    return {"top_features": top_features, "summary": summary}


def predict_demand(
    hospital_id: str,
    blood_group: BloodGroup,
    days: int = 7,
    session: Session | None = None,
) -> dict[str, Any] | None:
    model = _load_model(hospital_id, blood_group)
    if model is None:
        return None

    own_session = session is None
    if own_session:
        session = Session(engine)
    try:
        rows = list(
            session.exec(
                select(HistoricalDemand)
                .where(
                    HistoricalDemand.hospital_id == hospital_id,
                    HistoricalDemand.blood_group == blood_group,
                )
                .order_by(HistoricalDemand.date.desc())
                .limit(60)
            ).all()
        )
        rows.reverse()
        df = _build_feature_frame(rows, hospital_id, blood_group)
        latest = df.iloc[[-1]][FEATURE_COLUMNS]
        predicted_daily = max(0, float(model.predict(latest)[0]))
        predicted_demand = round(predicted_daily * days)

        inventory_items = list(
            session.exec(
                select(BloodInventory).where(
                    BloodInventory.hospital_id == hospital_id,
                    BloodInventory.blood_group == blood_group,
                )
            ).all()
        )
        available = sum(max(0, item.units_available - item.units_reserved) for item in inventory_items)
        shortage = max(0, predicted_demand - available)
        risk_score = float(np.clip(shortage / max(predicted_demand, 1), 0, 1))

        risk_level = (
            RiskLevel.CRITICAL if risk_score >= 0.7
            else RiskLevel.HIGH if risk_score >= 0.4
            else RiskLevel.MEDIUM if risk_score >= 0.2
            else RiskLevel.LOW
        )

        confidence = float(np.clip(1.0 - risk_score * 0.3 + (0.1 if len(rows) >= 28 else 0.0), 0.4, 0.95))

        importances = model.feature_importances_
        explanation = _make_explanation(FEATURE_COLUMNS, importances, predicted_demand, available, risk_score)

        return {
            "hospital_id": hospital_id,
            "blood_group": blood_group,
            "predicted_demand_7d": predicted_demand,
            "predicted_demand_30d": round(predicted_daily * 30),
            "predicted_shortage_units": shortage,
            "available_units": available,
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level,
            "confidence_score": round(confidence, 4),
            "explanation": explanation,
        }
    finally:
        if own_session:
            session.close()


def refresh_all_predictions(session: Session) -> list[dict[str, Any]]:
    hospitals = list(session.exec(select(Hospital).where(Hospital.is_active.is_(True))).all())
    results: list[dict[str, Any]] = []
    for hospital in hospitals:
        for bg in BloodGroup:
            pred = predict_demand(str(hospital.id), bg, days=7, session=session)
            if pred is None:
                continue
            prediction = AIPrediction(
                hospital_id=hospital.id,
                blood_group=bg,
                component="RBC",
                prediction_date=date.today(),
                predicted_shortage_units=pred["predicted_shortage_units"],
                predicted_demand_next_7d=pred["predicted_demand_7d"],
                predicted_demand_next_30d=pred["predicted_demand_30d"],
                risk_score=pred["risk_score"],
                risk_level=pred["risk_level"],
                confidence_score=pred["confidence_score"],
                explanation_json=pred["explanation"],
            )
            session.add(prediction)
            results.append(pred)
    session.commit()
    return results


def generate_redistribution_recommendations(session: Session) -> list[dict[str, Any]]:
    hospitals = list(session.exec(select(Hospital).where(Hospital.is_active.is_(True))).all())
    surplus: list[tuple[Hospital, BloodGroup, int]] = []
    shortage: list[tuple[Hospital, BloodGroup, int, float]] = []

    for hospital in hospitals:
        inventory_items = list(
            session.exec(
                select(BloodInventory).where(BloodInventory.hospital_id == hospital.id)
            ).all()
        )
        for item in inventory_items:
            available = item.units_available - item.units_reserved
            pred = predict_demand(str(hospital.id), item.blood_group, days=7, session=session)
            if pred is None:
                continue
            if pred["risk_score"] < 0.2 and available > 5:
                surplus.append((hospital, item.blood_group, available))
            elif pred["risk_score"] > 0.6:
                shortage.append((hospital, item.blood_group, pred["predicted_shortage_units"], pred["risk_score"]))

    recommendations: list[dict[str, Any]] = []
    for s_hospital, s_bg, s_units in surplus:
        for t_hospital, t_bg, t_shortage, t_risk in shortage:
            if s_bg != t_bg:
                continue
            distance = _haversine(
                s_hospital.latitude or 0, s_hospital.longitude or 0,
                t_hospital.latitude or 0, t_hospital.longitude or 0,
            )
            transfer_units = min(s_units, t_shortage, 20)
            if transfer_units <= 0:
                continue
            confidence = round(float(np.clip(0.9 - (distance / 500) * 0.3, 0.3, 0.95)), 2)
            recommendations.append(
                {
                    "source_hospital": {"id": str(s_hospital.id), "name": s_hospital.name},
                    "target_hospital": {"id": str(t_hospital.id), "name": t_hospital.name},
                    "blood_group": s_bg.value,
                    "units": transfer_units,
                    "confidence": confidence,
                    "distance_km": round(distance, 1),
                    "estimated_travel_mins": round(distance / 30 * 60),
                    "reasoning": f"Transfer {transfer_units} units of {s_bg.value} from {s_hospital.name} (surplus, risk {_hospital_risk(s_hospital, s_bg, session):.0%}) to {t_hospital.name} (shortage, risk {t_risk:.0%}).",
                }
            )
    recommendations.sort(key=lambda r: r["confidence"], reverse=True)
    return recommendations


def get_feature_importance(hospital_id: str | None = None, blood_group: BloodGroup | None = None) -> dict[str, Any]:
    model = None
    if hospital_id and blood_group:
        model = _load_model(hospital_id, blood_group)
    if model is None:
        sample_files = list(MODELS_DIR.glob("*.joblib"))
        if sample_files:
            model = joblib.load(sample_files[0])
    if model is None:
        return {"features": [], "summary": "No trained models available."}

    importances = model.feature_importances_
    total = float(importances.sum()) or 1.0
    features = sorted(
        [
            {"name": name, "importance": round(float(imp / total), 3)}
            for name, imp in zip(FEATURE_COLUMNS, importances)
        ],
        key=lambda f: f["importance"],
        reverse=True,
    )
    return {
        "top_3": features[:3],
        "all_features": features,
        "summary": f"Top predictive features: {', '.join(f['name'] for f in features[:3])}.",
    }


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))


def _hospital_risk(hospital: Hospital, blood_group: BloodGroup, session: Session) -> float:
    pred = predict_demand(str(hospital.id), blood_group, days=7, session=session)
    return pred["risk_score"] if pred else 0.0
