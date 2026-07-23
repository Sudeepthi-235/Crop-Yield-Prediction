import numpy as np
import pandas as pd
from config import CROP_DURATIONS, BASE_TEMPS, STAGE_ORDER, SOIL_TYPES, NPK_MAP, DEFAULT_SOIL
from typing import Dict, Any


def get_stage_bounds(crop: str) -> Dict[str, tuple]:
    return CROP_DURATIONS.get(crop.lower(), CROP_DURATIONS["default"])


def get_current_stage(crop: str, day: int) -> Dict[str, Any]:
    stages = get_stage_bounds(crop)
    for stage in STAGE_ORDER:
        s, e = stages[stage]
        if s <= day < e:
            total = e - s
            progress = round(((day - s) / total) * 100, 1)
            return {
                "name": stage.capitalize(),
                "progress_percent": min(progress, 100),
                "days_remaining": max(0, e - day),
            }
    # Past maturity
    return {"name": "Maturity", "progress_percent": 100, "days_remaining": 0}


def compute_gdd(tmax: float, tmin: float, base_temp: float) -> float:
    return max(0, ((tmax + tmin) / 2) - base_temp)


def engineer_stage_features(weather_df: pd.DataFrame, ndvi_df: pd.DataFrame,
                             crop: str, sowing_day: int = 0) -> Dict[str, float]:
    """Compute per-stage aggregated features."""
    stages = get_stage_bounds(crop)
    base_temp = BASE_TEMPS.get(crop.lower(), BASE_TEMPS["default"])

    merged = weather_df.copy().reset_index(drop=True)
    merged["day"] = range(sowing_day, sowing_day + len(merged))
    merged = merged.merge(ndvi_df[["date", "ndvi"]], on="date", how="left")
    merged["ndvi"] = merged["ndvi"].fillna(0.3)
    merged["gdd"] = merged.apply(lambda r: compute_gdd(r["tmax"], r["tmin"], base_temp), axis=1)

    features = {}
    for stage in STAGE_ORDER:
        s, e = stages[stage]
        mask = (merged["day"] >= s) & (merged["day"] < e)
        sub = merged[mask]

        if sub.empty:
            features[f"{stage}_avg_temp"] = 25.0
            features[f"{stage}_total_rain"] = 30.0
            features[f"{stage}_avg_humidity"] = 65.0
            features[f"{stage}_mean_ndvi"] = 0.4
            features[f"{stage}_gdd"] = 100.0
        else:
            features[f"{stage}_avg_temp"] = round(((sub["tmax"] + sub["tmin"]) / 2).mean(), 2)
            features[f"{stage}_total_rain"] = round(sub["rainfall"].sum(), 2)
            features[f"{stage}_avg_humidity"] = round(sub["humidity"].mean(), 2)
            features[f"{stage}_mean_ndvi"] = round(sub["ndvi"].mean(), 3)
            features[f"{stage}_gdd"] = round(sub["gdd"].sum(), 2)

    return features


def encode_soil(soil: Dict[str, Any]) -> Dict[str, float]:
    soil = {**DEFAULT_SOIL, **soil}

    def npk_encode(val):
        if isinstance(val, str):
            return NPK_MAP.get(val.lower(), 2)
        # numeric 1–5 scale: map to 1,2,3
        if val <= 1: return 1
        elif val <= 3: return 2
        return 3

    encoded = {
        "soil_ph": float(soil.get("ph", 6.5)),
        "organic_carbon": float(soil.get("organic_carbon", 0.6)),
        "nitrogen": npk_encode(soil.get("nitrogen", 2)),
        "phosphorus": npk_encode(soil.get("phosphorus", 2)),
        "potassium": npk_encode(soil.get("potassium", 2)),
    }
    # One-hot encode soil type
    soil_type = str(soil.get("type", "loamy")).lower()
    for t in SOIL_TYPES:
        encoded[f"soil_{t}"] = 1.0 if t == soil_type else 0.0

    return encoded


def encode_crop(crop: str) -> Dict[str, float]:
    crops = ["rice", "wheat", "maize"]
    return {f"crop_{c}": 1.0 if c == crop.lower() else 0.0 for c in crops}


def build_feature_vector(stage_features: Dict, soil_features: Dict, crop_features: Dict) -> np.ndarray:
    """Assemble ordered feature vector."""
    ordered = {}
    ordered.update(stage_features)
    ordered.update(soil_features)
    ordered.update(crop_features)
    return np.array(list(ordered.values()), dtype=np.float32), list(ordered.keys())
