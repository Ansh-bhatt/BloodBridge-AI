import pandas as pd

FEATURE_COLUMNS = ["day_of_week", "is_weekend", "month", "day_of_month", "rolling_7d_mean", "rolling_30d_mean", "lag_1d", "lag_7d"]


def create_features(dataframe: pd.DataFrame) -> pd.DataFrame:
    dataframe = dataframe.copy().sort_values(["hospital_id", "blood_group", "date"])
    dataframe["date"] = pd.to_datetime(dataframe["date"])
    dataframe["day_of_week"] = dataframe["date"].dt.dayofweek
    dataframe["is_weekend"] = dataframe["day_of_week"].isin([5, 6]).astype(int)
    dataframe["month"] = dataframe["date"].dt.month
    dataframe["day_of_month"] = dataframe["date"].dt.day
    groups = dataframe.groupby(["hospital_id", "blood_group"])["units_used"]
    dataframe["rolling_7d_mean"] = groups.transform(lambda values: values.rolling(7, min_periods=1).mean())
    dataframe["rolling_30d_mean"] = groups.transform(lambda values: values.rolling(30, min_periods=1).mean())
    dataframe["lag_1d"] = groups.shift(1)
    dataframe["lag_7d"] = groups.shift(7)
    return dataframe.fillna(0)
