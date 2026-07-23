import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import date, timedelta
import numpy as np
import joblib
import traceback

from utils.weather import fetch_weather
from utils.ndvi import fetch_ndvi
from utils.features import (
    engineer_stage_features, encode_soil, encode_crop,
    build_feature_vector, get_current_stage, get_stage_bounds
)
from utils.risk_engine import detect_risks, generate_insights, generate_suggestions
from config import STAGE_ORDER, DEFAULT_SOIL
from train_model import MODEL_PATH, FEATURE_PATH, train

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Crop Yield Forecasting API",
    description="AI-based crop yield prediction using multi-stage growth modeling",
    version="1.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Load model ────────────────────────────────────────────────────────────────
def load_model():
    if not os.path.exists(MODEL_PATH):
        print("Model not found — training now...")
        train()
    return joblib.load(MODEL_PATH), joblib.load(FEATURE_PATH)

MODEL, FEATURE_NAMES = load_model()

# ── Schemas ───────────────────────────────────────────────────────────────────
class Location(BaseModel):
    lat: float
    lon: float

class Soil(BaseModel):
    type: Optional[str] = "loamy"
    ph: Optional[float] = 6.5
    organic_carbon: Optional[float] = 0.6
    nitrogen: Optional[Any] = 2
    phosphorus: Optional[Any] = 2
    potassium: Optional[Any] = 2

class PredictRequest(BaseModel):
    crop: str = Field(default="rice", example="rice")
    location: Location
    sowing_date: str = Field(example="2026-01-10")
    soil: Optional[Soil] = None
    land_area: Optional[float] = 1.0


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": MODEL is not None,
        "version": "1.0.0",
    }


@app.post("/predict")
def predict(req: PredictRequest):
    try:
        # 1. Parse dates
        sowing = date.fromisoformat(req.sowing_date)
        today = date.today()
        forecast_end = today + timedelta(days=10)
        days_since_sowing = (today - sowing).days

        crop = req.crop.lower()
        stages = get_stage_bounds(crop)
        total_days = max(s[1] for s in stages.values())

       # 2. FINAL FIXED weather range logic

        # Prevent invalid location
        if req.location.lat == 0 and req.location.lon == 0:
            raise HTTPException(status_code=400, detail="Invalid location (0,0)")

        # Limit past data
        weather_start_date = max(sowing, today - timedelta(days=30))

        # Respect crop duration
        crop_end_date = sowing + timedelta(days=total_days)

        # Limit forecast (API limit)
        forecast_limit = today + timedelta(days=15)

        # Final safe end date
        weather_end_date = min(crop_end_date, forecast_limit)

        weather_start = weather_start_date.isoformat()
        weather_end = weather_end_date.isoformat()

        weather_df = fetch_weather(
            req.location.lat,
            req.location.lon,
            weather_start,
            weather_end
        )
        # 3. Fetch NDVI
        ndvi_df = fetch_ndvi(req.location.lat, req.location.lon, weather_start, total_days)

        # 4. Feature engineering
        stage_features = engineer_stage_features(weather_df, ndvi_df, crop)

        # 5. Soil + crop encoding
        soil_dict = req.soil.dict() if req.soil else DEFAULT_SOIL
        soil_features = encode_soil(soil_dict)
        crop_features = encode_crop(crop)

        # 6. Build feature vector (aligned to training order)
        fv, keys = build_feature_vector(stage_features, soil_features, crop_features)
        key_to_val = dict(zip(keys, fv))
        fv_ordered = np.array([key_to_val.get(n, 0.0) for n in FEATURE_NAMES], dtype=np.float32)

        # 7. Predict
        raw_pred = float(MODEL.predict(fv_ordered.reshape(1, -1))[0])
        yield_per_ha = round(max(0.5, raw_pred), 2)
        total_yield = round(yield_per_ha * (req.land_area or 1.0), 2)

        # Confidence based on data completeness
        confidence = "high" if days_since_sowing > 45 else ("medium" if days_since_sowing > 15 else "low")

        # 8. Current stage
        current_stage_info = get_current_stage(crop, days_since_sowing)

        # 9. Risks
        risks = detect_risks(stage_features, current_stage_info["name"])

        # 10. Insights for completed stages
        completed = [s for s in STAGE_ORDER
                     if days_since_sowing > stages[s][0]]
        insights = generate_insights(stage_features, completed)

        # 11. Suggestions
        suggestions = generate_suggestions(risks)

        return {
            "yield_prediction": {
                "value": yield_per_ha,
                "total_yield": total_yield,
                "unit": "tons/hectare",
                "land_area_ha": req.land_area,
                "confidence": confidence,
            },
            "current_stage": current_stage_info,
            "risks": risks,
            "stage_insights": insights,
            "suggestions": suggestions,
            "meta": {
                "crop": crop,
                "days_since_sowing": days_since_sowing,
                "location": {"lat": req.location.lat, "lon": req.location.lon},
            },
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train")
def retrain(background_tasks: BackgroundTasks):
    """Retrain model in background."""
    def _retrain():
        global MODEL, FEATURE_NAMES
        rmse = train()
        MODEL, FEATURE_NAMES = load_model()
        print(f"Retraining complete. RMSE={rmse:.4f}")

    background_tasks.add_task(_retrain)
    return {"message": "Retraining started in background"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
