"""
Train XGBoost crop yield model on a synthetic dataset.
Run directly: python train_model.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import pandas as pd
import joblib
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from config import STAGE_ORDER, SOIL_TYPES

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "model.pkl")
FEATURE_PATH = os.path.join(os.path.dirname(__file__), "models", "feature_names.pkl")

N_SAMPLES = 5000
np.random.seed(42)


def generate_synthetic_dataset(n=N_SAMPLES) -> pd.DataFrame:
    rows = []
    crops = ["rice", "wheat", "maize"]
    crop_base_yield = {"rice": 4.0, "wheat": 3.2, "maize": 5.0}

    for _ in range(n):
        crop = np.random.choice(crops)
        row = {}

        # Stage features
        for stage in STAGE_ORDER:
            avg_temp = np.random.uniform(15, 42)
            total_rain = np.random.exponential(40)
            avg_humidity = np.random.uniform(30, 95)
            mean_ndvi = np.random.uniform(0.1, 0.9)
            gdd = np.random.uniform(50, 400)
            row[f"{stage}_avg_temp"] = avg_temp
            row[f"{stage}_total_rain"] = total_rain
            row[f"{stage}_avg_humidity"] = avg_humidity
            row[f"{stage}_mean_ndvi"] = mean_ndvi
            row[f"{stage}_gdd"] = gdd

        # Soil features
        soil_type = np.random.choice(SOIL_TYPES)
        row["soil_ph"] = np.random.uniform(5.0, 8.5)
        row["organic_carbon"] = np.random.uniform(0.2, 2.5)
        row["nitrogen"] = np.random.choice([1, 2, 3])
        row["phosphorus"] = np.random.choice([1, 2, 3])
        row["potassium"] = np.random.choice([1, 2, 3])
        for t in SOIL_TYPES:
            row[f"soil_{t}"] = 1.0 if t == soil_type else 0.0

        # Crop encoding
        for c in crops:
            row[f"crop_{c}"] = 1.0 if c == crop else 0.0

        # Yield label (domain-informed synthetic formula)
        base = crop_base_yield[crop]
        rain_factor = min(row["flowering_total_rain"] / 60, 1.5)
        ndvi_factor = row["flowering_mean_ndvi"] * 2
        temp_penalty = max(0, (row["flowering_avg_temp"] - 33) * 0.05)
        soil_bonus = (row["nitrogen"] + row["phosphorus"] + row["potassium"] - 3) * 0.1
        ph_bonus = max(0, 1 - abs(row["soil_ph"] - 6.5) * 0.2)
        noise = np.random.normal(0, 0.2)
        yield_val = base + rain_factor + ndvi_factor - temp_penalty + soil_bonus + ph_bonus + noise
        row["yield"] = round(max(0.5, min(12.0, yield_val)), 2)
        rows.append(row)

    return pd.DataFrame(rows)


def train():
    print("Generating synthetic dataset...")
    df = generate_synthetic_dataset()

    feature_cols = [c for c in df.columns if c != "yield"]
    X = df[feature_cols].values
    y = df["yield"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training on {len(X_train)} samples, testing on {len(X_test)}...")
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    rmse = mean_squared_error(y_test, preds) ** 0.5
    print(f"✅ Model trained | RMSE: {rmse:.4f} tons/hectare")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(feature_cols, FEATURE_PATH)
    print(f"✅ Model saved → {MODEL_PATH}")
    return rmse


if __name__ == "__main__":
    train()
