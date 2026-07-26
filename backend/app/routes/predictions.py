from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from ..auth.dependencies import get_current_user
from ..db.mongo import (
    save_prediction,
    get_user_predictions,
    get_prediction_by_id,
    delete_prediction,
)

router = APIRouter(prefix="/api/prediction", tags=["User Predictions History"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user_prediction(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    """Save prediction result associated with authenticated Clerk user ID."""
    user_id = current_user["user_id"]
    saved_doc = await save_prediction(user_id=user_id, data=data)
    return {"msg": "Prediction saved successfully", "prediction": saved_doc}


@router.get("")
async def list_user_predictions(
    current_user: dict = Depends(get_current_user),
):
    """Retrieve all predictions owned by authenticated Clerk user."""
    user_id = current_user["user_id"]
    predictions = await get_user_predictions(user_id=user_id)
    return predictions


@router.get("/{prediction_id}")
async def get_single_prediction(
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get single prediction owned by authenticated Clerk user."""
    user_id = current_user["user_id"]
    prediction = await get_prediction_by_id(prediction_id=prediction_id, user_id=user_id)

    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found or access denied",
        )

    return prediction


@router.delete("/{prediction_id}")
async def remove_user_prediction(
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a prediction owned by authenticated Clerk user."""
    user_id = current_user["user_id"]
    success = await delete_prediction(prediction_id=prediction_id, user_id=user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found or access denied",
        )

    return {"msg": "Prediction deleted successfully"}
