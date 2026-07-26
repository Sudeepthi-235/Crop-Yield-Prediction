from datetime import date, timedelta
import numpy as np
from typing import Dict, Any, Optional

from .utils.weather import fetch_weather
from .utils.ndvi import fetch_ndvi
from .utils.features import (
    engineer_stage_features, encode_soil, encode_crop,
    build_feature_vector, get_current_stage, get_stage_bounds
)
from .utils.risk_engine import detect_risks, generate_insights, generate_suggestions
from .config import STAGE_ORDER, DEFAULT_SOIL
from .model_loader import load_model


def run_prediction(
    crop: str,
    lat: float,
    lon: float,
    sowing_date_str: str,
    soil_dict: Optional[Dict[str, Any]] = None,
    land_area: Optional[float] = 1.0,
) -> Dict[str, Any]:
    """Execute complete crop yield prediction pipeline."""
    model, feature_names = load_model()

    # 1. Parse dates
    sowing = date.fromisoformat(sowing_date_str)
    today = date.today()
    days_since_sowing = (today - sowing).days

    crop_lower = crop.lower()
    stages = get_stage_bounds(crop_lower)
    total_days = max(s[1] for s in stages.values())

    # 2. Weather date range calculation
    if lat == 0 and lon == 0:
        raise ValueError("Invalid location (0,0)")

    weather_start_date = max(sowing, today - timedelta(days=30))
    crop_end_date = sowing + timedelta(days=total_days)
    forecast_limit = today + timedelta(days=15)
    weather_end_date = min(crop_end_date, forecast_limit)

    weather_start = weather_start_date.isoformat()
    weather_end = weather_end_date.isoformat()

    # 3. Fetch Weather & NDVI signals
    weather_df = fetch_weather(lat, lon, weather_start, weather_end)
    ndvi_df = fetch_ndvi(lat, lon, weather_start, total_days)

    # 4. Feature engineering
    stage_features = engineer_stage_features(weather_df, ndvi_df, crop_lower)

    # 5. Soil + Crop encoding
    final_soil = {**DEFAULT_SOIL, **(soil_dict or {})}
    soil_features = encode_soil(final_soil)
    crop_features = encode_crop(crop_lower)

    # 6. Feature vector ordering
    fv, keys = build_feature_vector(stage_features, soil_features, crop_features)
    key_to_val = dict(zip(keys, fv))
    fv_ordered = np.array([key_to_val.get(n, 0.0) for n in feature_names], dtype=np.float32)

    # 7. Predict
    raw_pred = float(model.predict(fv_ordered.reshape(1, -1))[0])
    yield_per_ha = round(max(0.5, raw_pred), 2)
    area = float(land_area or 1.0)
    total_yield = round(yield_per_ha * area, 2)

    confidence = "high" if days_since_sowing > 45 else ("medium" if days_since_sowing > 15 else "low")
    current_stage_info = get_current_stage(crop_lower, days_since_sowing)

    # 8. Risk detection, Insights, Suggestions
    risks = detect_risks(stage_features, current_stage_info["name"])
    completed = [s for s in STAGE_ORDER if days_since_sowing > stages[s][0]]
    insights = generate_insights(stage_features, completed)
    suggestions = generate_suggestions(risks)

    return {
        "yield_prediction": {
            "value": yield_per_ha,
            "total_yield": total_yield,
            "unit": "tons/hectare",
            "land_area_ha": area,
            "confidence": confidence,
        },
        "current_stage": current_stage_info,
        "risks": risks,
        "stage_insights": insights,
        "suggestions": suggestions,
        "meta": {
            "crop": crop_lower,
            "days_since_sowing": days_since_sowing,
            "location": {"lat": lat, "lon": lon},
        },
    }
