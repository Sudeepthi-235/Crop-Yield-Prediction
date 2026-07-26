import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .routes import predict, predictions, admin
from .ml.model_loader import load_model

app = FastAPI(
    title="Crop Yield Prediction Unified API",
    description="Unified single-service application with ML yield forecasting, Clerk Auth, and MongoDB prediction history.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(predict.router)
app.include_router(predictions.router)
app.include_router(admin.router)


@app.on_event("startup")
def startup_event():
    print("[Startup] Loading ML model into memory...")
    load_model()
    print("✅ [Startup] ML model successfully cached in memory.")


@app.get("/api/health", tags=["Health"])
def health_check():
    model, feature_names = load_model()
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "features_count": len(feature_names) if feature_names else 0,
        "service": "Crop Yield Prediction Unified Application",
    }


# Serve Frontend SPA Static Assets in Production
# __file__ = backend/app/main.py → go up 3 levels to reach DT/ root
PROJECT_ROOT = Path(__file__).parent.parent.parent
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")

        target_file = FRONTEND_DIST / full_path
        if target_file.is_file():
            return FileResponse(target_file)

        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)

        return {"message": "Frontend build not found. Please build the frontend."}
