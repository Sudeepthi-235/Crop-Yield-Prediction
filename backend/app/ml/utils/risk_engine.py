from ..config import RISK_THRESHOLDS, STAGE_ORDER
from typing import List, Dict, Any


def detect_risks(stage_features: Dict[str, float], current_stage: str) -> List[Dict[str, str]]:
    risks = []
    current = current_stage.lower()

    # Water stress during flowering
    flower_rain = stage_features.get("flowering_total_rain", 999)
    if flower_rain < RISK_THRESHOLDS["low_rainfall_flowering"]:
        risks.append({
            "type": "water_stress",
            "message": f"Low rainfall ({flower_rain:.1f}mm) during flowering stage",
            "severity": "high" if flower_rain < 10 else "medium",
        })

    # Heat stress
    for stage in STAGE_ORDER:
        avg_temp = stage_features.get(f"{stage}_avg_temp", 0)
        if avg_temp > RISK_THRESHOLDS["high_temp"]:
            risks.append({
                "type": "heat_stress",
                "message": f"High average temperature ({avg_temp:.1f}°C) during {stage} stage",
                "severity": "high" if avg_temp > 40 else "medium",
            })

    # Poor vegetation (NDVI)
    for stage in STAGE_ORDER:
        ndvi = stage_features.get(f"{stage}_mean_ndvi", 1.0)
        if ndvi < RISK_THRESHOLDS["low_ndvi"] and stage in [current, "vegetative"]:
            risks.append({
                "type": "poor_growth",
                "message": f"Low NDVI ({ndvi:.2f}) during {stage} stage — poor vegetation coverage",
                "severity": "medium",
            })

    # Excess rain (flooding risk)
    for stage in STAGE_ORDER:
        rain = stage_features.get(f"{stage}_total_rain", 0)
        if rain > 300:
            risks.append({
                "type": "flood_risk",
                "message": f"Excessive rainfall ({rain:.0f}mm) during {stage} — possible waterlogging",
                "severity": "high",
            })

    return risks


def generate_insights(stage_features: Dict[str, float], completed_stages: List[str]) -> List[Dict[str, str]]:
    insights = []
    for stage in completed_stages:
        ndvi = stage_features.get(f"{stage}_mean_ndvi", 0)
        rain = stage_features.get(f"{stage}_total_rain", 0)
        temp = stage_features.get(f"{stage}_avg_temp", 25)

        if ndvi > 0.6 and rain > 30:
            status = "Good growth"
        elif ndvi < 0.3 or rain < 10:
            status = "Water stress detected"
        elif temp > 35:
            status = "Heat stress detected"
        else:
            status = "Moderate growth"

        insights.append({"stage": stage.capitalize(), "status": status})
    return insights


def generate_suggestions(risks: List[Dict]) -> List[str]:
    suggestions = []
    risk_types = {r["type"] for r in risks}

    if "water_stress" in risk_types:
        suggestions.append("Increase irrigation in the next 5–7 days")
        suggestions.append("Consider drip irrigation to optimize water use")
    if "heat_stress" in risk_types:
        suggestions.append("Apply mulching to reduce soil temperature")
        suggestions.append("Schedule irrigation during early morning or evening")
    if "poor_growth" in risk_types:
        suggestions.append("Consider foliar nutrient spray to boost canopy growth")
    if "flood_risk" in risk_types:
        suggestions.append("Ensure drainage channels are clear to prevent waterlogging")
    if not suggestions:
        suggestions.append("Crop is progressing well — maintain current practices")

    return suggestions
