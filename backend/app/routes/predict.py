from fastapi import APIRouter, Depends, HTTPException, status
import traceback

from ..schemas.predict_schema import PredictRequest
from ..ml.predictor import run_prediction
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["ML Model"])


@router.post("/predict")
def predict_crop(
    req: PredictRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Protected ML Crop Yield Prediction API.
    Requires authenticated Clerk user (USER or ADMIN role).
    """
    try:
        soil_dict = req.soil.dict() if req.soil else None

        result = run_prediction(
            crop=req.crop,
            lat=req.location.lat,
            lon=req.location.lon,
            sowing_date_str=req.sowing_date,
            soil_dict=soil_dict,
            land_area=req.land_area,
        )

        return result

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction calculation failed: {str(e)}",
        )


@router.post("/mlmodel")
def predict_crop_legacy_alias(
    req: PredictRequest,
    current_user: dict = Depends(get_current_user),
):
    """Alias for backwards compatibility with previous frontend /api/mlmodel endpoint."""
    return predict_crop(req, current_user)
