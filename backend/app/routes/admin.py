from fastapi import APIRouter, Depends, HTTPException, status
from ..auth.dependencies import require_admin
from ..db.mongo import get_admin_stats, get_db, _in_memory_predictions

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])


@router.get("/stats")
async def admin_stats(current_user: dict = Depends(require_admin)):
    """
    Get high-level system analytics & stats.
    Strictly requires ADMIN role (returns HTTP 403 for regular users).
    """
    stats = await get_admin_stats()
    return {
        "admin_user": current_user["email"],
        "role": current_user["role"],
        "metrics": stats,
    }


@router.get("/predictions")
async def admin_all_predictions(current_user: dict = Depends(require_admin)):
    """
    Get all predictions across all users (ADMIN role required).
    """
    database = get_db()
    if database is not None:
        try:
            cursor = database["predictions"].find({}).sort("created_at", -1).limit(100)
            results = []
            async for doc in cursor:
                doc["id"] = str(doc["_id"])
                doc["_id"] = doc["id"]
                results.append(doc)
            return {"count": len(results), "predictions": results}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return {"count": len(_in_memory_predictions), "predictions": _in_memory_predictions}
