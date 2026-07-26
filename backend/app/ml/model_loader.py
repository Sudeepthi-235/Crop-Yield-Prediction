import os
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "model.pkl")
FEATURE_PATH = os.path.join(BASE_DIR, "models", "feature_names.pkl")

_MODEL = None
_FEATURE_NAMES = None


def load_model():
    global _MODEL, _FEATURE_NAMES
    if _MODEL is None or _FEATURE_NAMES is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(FEATURE_PATH):
            print("[ML] Model/Feature files missing — running training pipeline...")
            from .train_model import train
            train()
        _MODEL = joblib.load(MODEL_PATH)
        _FEATURE_NAMES = joblib.load(FEATURE_PATH)
    return _MODEL, _FEATURE_NAMES
