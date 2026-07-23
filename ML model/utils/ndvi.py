import numpy as np
import pandas as pd
from datetime import date, timedelta


def fetch_ndvi(lat: float, lon: float, start_date: str, total_days: int) -> pd.DataFrame:
    """
    Simulate NDVI as a bell-curve peaking at flowering stage.
    Real implementation can swap in NASA EarthData / Sentinel Hub.
    """
    days = list(range(total_days))
    # NDVI follows a realistic crop growth curve
    peak_day = int(total_days * 0.6)
    ndvi = []
    for d in days:
        if d < 15:
            val = 0.1 + (d / 15) * 0.2          # germination: low
        elif d < peak_day:
            val = 0.3 + ((d - 15) / (peak_day - 15)) * 0.55  # vegetative → flowering
        else:
            val = 0.85 - ((d - peak_day) / (total_days - peak_day)) * 0.6  # maturity: declining
        noise = np.random.normal(0, 0.03)
        ndvi.append(round(max(0.05, min(0.95, val + noise)), 3))

    start = date.fromisoformat(start_date)
    dates = [start + timedelta(days=i) for i in days]
    return pd.DataFrame({"date": pd.to_datetime(dates), "ndvi": ndvi})
