import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Starting Unified Crop Yield Prediction Application on port {port}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
