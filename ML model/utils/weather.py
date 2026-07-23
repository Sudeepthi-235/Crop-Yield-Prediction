import httpx
import pandas as pd
from datetime import date, timedelta
import numpy as np


def fetch_weather(lat: float, lon: float, start_date: str, end_date: str) -> pd.DataFrame:
    """Fetch daily weather from Open-Meteo. Falls back to synthetic data on failure."""
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean",
            "start_date": start_date,
            "end_date": end_date,
            "timezone": "auto",
        }
        with httpx.Client(timeout=15) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()["daily"]

        df = pd.DataFrame({
            "date": pd.to_datetime(data["time"]),
            "tmax": data["temperature_2m_max"],
            "tmin": data["temperature_2m_min"],
            "rainfall": data["precipitation_sum"],
            "humidity": data.get("relative_humidity_2m_mean", [60] * len(data["time"])),
        })
        df = df.fillna(method="ffill").fillna(method="bfill").fillna(0)
        return df

    except Exception as e:
        print(f"[Weather] API failed ({e}), using synthetic data.")
        return _synthetic_weather(start_date, end_date, lat)


def _synthetic_weather(start_date: str, end_date: str, lat: float) -> pd.DataFrame:
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    days = (end - start).days + 1
    np.random.seed(42)
    dates = [start + timedelta(days=i) for i in range(days)]
    base_temp = max(15, 35 - abs(lat - 20) * 0.3)
    return pd.DataFrame({
        "date": pd.to_datetime(dates),
        "tmax": np.random.normal(base_temp + 5, 3, days).clip(10, 45),
        "tmin": np.random.normal(base_temp - 5, 3, days).clip(5, 35),
        "rainfall": np.random.exponential(3, days).clip(0, 50),
        "humidity": np.random.normal(65, 10, days).clip(20, 100),
    })
