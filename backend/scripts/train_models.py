"""Train one compact XGBoost demand model per hospital and blood group."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import joblib
import pandas as pd
from sklearn.metrics import root_mean_squared_error
from sqlmodel import Session, select
from xgboost import XGBRegressor

from app.database import engine
from app.models import HistoricalDemand
from app.services.feature_engineering import FEATURE_COLUMNS, create_features


def main() -> None:
    with Session(engine) as session:
        rows = session.exec(select(HistoricalDemand)).all()
    if not rows:
        raise SystemExit("No historical demand found. Run scripts/seed_data.py first.")
    data = pd.DataFrame([row.model_dump() for row in rows])
    data = create_features(data)
    models_dir = ROOT / "ml_models"
    models_dir.mkdir(exist_ok=True)
    metadata = {}
    for (hospital_id, blood_group), group in data.groupby(["hospital_id", "blood_group"]):
        group = group.sort_values("date")
        split = max(20, int(len(group) * 0.8))
        train, test = group.iloc[:split], group.iloc[split:]
        model = XGBRegressor(n_estimators=80, max_depth=3, learning_rate=0.08, objective="reg:squarederror", random_state=42)
        model.fit(train[FEATURE_COLUMNS], train["units_used"])
        model_name = f"{hospital_id}_{blood_group.replace('+', 'pos').replace('-', 'neg')}.joblib"
        joblib.dump(model, models_dir / model_name, compress=3)
        metadata[model_name] = {"rmse": round(float(root_mean_squared_error(test["units_used"], model.predict(test[FEATURE_COLUMNS]))), 2), "features": FEATURE_COLUMNS}
    (models_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))
    print(f"Trained {len(metadata)} XGBoost models.")


if __name__ == "__main__":
    main()
