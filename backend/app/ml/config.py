CROP_DURATIONS = {
    "rice":    {"germination": (0,15), "vegetative": (15,45), "flowering": (45,75), "maturity": (75,120)},
    "wheat":   {"germination": (0,10), "vegetative": (10,40), "flowering": (40,70), "maturity": (70,110)},
    "maize":   {"germination": (0,12), "vegetative": (12,40), "flowering": (40,65), "maturity": (65,100)},
    "default": {"germination": (0,15), "vegetative": (15,45), "flowering": (45,75), "maturity": (75,120)},
}

BASE_TEMPS = {"rice": 10, "wheat": 5, "maize": 10, "default": 10}

SOIL_TYPES = ["sandy", "loamy", "clay", "silty", "peaty", "chalky"]

NPK_MAP = {"low": 1, "medium": 2, "high": 3}

DEFAULT_SOIL = {
    "type": "loamy", "ph": 6.5, "organic_carbon": 0.6,
    "nitrogen": 2, "phosphorus": 2, "potassium": 2
}

STAGE_ORDER = ["germination", "vegetative", "flowering", "maturity"]

RISK_THRESHOLDS = {
    "low_rainfall_flowering": 20,   # mm total during flowering
    "high_temp": 35,                # °C avg
    "low_ndvi": 0.3,
}
