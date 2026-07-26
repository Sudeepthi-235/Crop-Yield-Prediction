import datetime
from typing import List, Dict, Any, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from ..config import MONGO_URI, MONGO_DB_NAME

client: Optional[AsyncIOMotorClient] = None
db = None

# Fallback in-memory store if MongoDB is not connected
_in_memory_predictions: List[Dict[str, Any]] = []


def get_db():
    global client, db
    if db is None and MONGO_URI:
        try:
            client = AsyncIOMotorClient(MONGO_URI)
            db = client[MONGO_DB_NAME]
            print(f"✅ [MongoDB] Connected to database: {MONGO_DB_NAME}")
        except Exception as e:
            print(f"⚠️ [MongoDB] Connection warning: {e}. Falling back to transient storage.")
    return db


async def save_prediction(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    database = get_db()
    now = datetime.datetime.utcnow().isoformat()

    doc = {
        "user_id": user_id,
        "crop": data.get("crop", "unknown"),
        "location": data.get("location", {}),
        "yield_prediction": data.get("yield_prediction", {}),
        "current_stage": data.get("current_stage", {}),
        "risks": data.get("risks", []),
        "stage_insights": data.get("stage_insights", []),
        "suggestions": data.get("suggestions", []),
        "meta": data.get("meta", {}),
        "created_at": now,
        "updated_at": now,
    }

    if database is not None:
        try:
            res = await database["predictions"].insert_one(doc)
            doc["_id"] = str(res.inserted_id)
            doc["id"] = doc["_id"]
            return doc
        except Exception as e:
            print(f"[MongoDB] Insert error: {e}")

    # Fallback to in-memory store
    doc["_id"] = str(ObjectId())
    doc["id"] = doc["_id"]
    _in_memory_predictions.append(doc)
    return doc


async def get_user_predictions(user_id: str) -> List[Dict[str, Any]]:
    database = get_db()
    if database is not None:
        try:
            cursor = database["predictions"].find({"user_id": user_id}).sort("created_at", -1)
            results = []
            async for doc in cursor:
                doc["id"] = str(doc["_id"])
                doc["_id"] = doc["id"]
                results.append(doc)
            return results
        except Exception as e:
            print(f"[MongoDB] Find error: {e}")

    # In-memory fallback
    return [p for p in _in_memory_predictions if p["user_id"] == user_id]


async def get_prediction_by_id(prediction_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    database = get_db()
    if database is not None:
        try:
            doc = await database["predictions"].find_one({"_id": ObjectId(prediction_id), "user_id": user_id})
            if doc:
                doc["id"] = str(doc["_id"])
                doc["_id"] = doc["id"]
                return doc
        except Exception as e:
            print(f"[MongoDB] FindOne error: {e}")

    # In-memory fallback
    for p in _in_memory_predictions:
        if p["id"] == prediction_id and p["user_id"] == user_id:
            return p
    return None


async def delete_prediction(prediction_id: str, user_id: str) -> bool:
    database = get_db()
    if database is not None:
        try:
            res = await database["predictions"].delete_one({"_id": ObjectId(prediction_id), "user_id": user_id})
            return res.deleted_count > 0
        except Exception as e:
            print(f"[MongoDB] Delete error: {e}")

    # In-memory fallback
    global _in_memory_predictions
    initial_len = len(_in_memory_predictions)
    _in_memory_predictions = [p for p in _in_memory_predictions if not (p["id"] == prediction_id and p["user_id"] == user_id)]
    return len(_in_memory_predictions) < initial_len


async def get_admin_stats() -> Dict[str, Any]:
    """Get system stats for Admin dashboard."""
    database = get_db()
    total_preds = 0
    total_users = 0
    if database is not None:
        try:
            total_preds = await database["predictions"].count_documents({})
            distinct_users = await database["predictions"].distinct("user_id")
            total_users = len(distinct_users)
        except Exception as e:
            print(f"[MongoDB] AdminStats error: {e}")
    else:
        total_preds = len(_in_memory_predictions)
        total_users = len(set(p["user_id"] for p in _in_memory_predictions))

    return {
        "total_predictions": total_preds,
        "active_users": total_users,
        "status": "healthy",
        "ml_model": "XGBoost v1.0.0",
    }
