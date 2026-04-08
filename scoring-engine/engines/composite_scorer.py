"""
engines/composite_scorer.py - Combines all scoring engines into final score

Implements overall scoring formula:
overall = (
  locationScore × 0.35 +
  connectivityScore × 0.30 +
  amenitiesScore × 0.20 +
  roiPotential × 0.15
)
"""

from engines.location_scorer import calculate_location_score
from engines.connectivity_scorer import calculate_connectivity_score
from engines.amenities_scorer import calculate_amenities_score
from engines.roi_scorer import calculate_roi_score


def calculate_composite_score(property_data: dict) -> dict:
    """
    Calculate overall composite score by combining all scoring engines.

    Args:
        property_data: Complete property data dictionary

    Returns:
        {
            "success": true,
            "data": {
                "overall": 0-100,
                "locationScore": 0-100,
                "connectivityScore": 0-100,
                "amenitiesScore": 0-100,
                "roiPotential": 0-100,
                "breakdown": {
                    "location": { ... detailed location breakdown ... },
                    "connectivity": { ... detailed connectivity breakdown ... },
                    "amenities": { ... detailed amenities breakdown ... },
                    "roiPotential": { ... detailed ROI breakdown ... }
                },
                "timestamp": "ISO timestamp"
            }
        }
    """
    # Calculate individual component scores
    location_result = calculate_location_score(property_data)
    connectivity_result = calculate_connectivity_score(property_data)
    amenities_result = calculate_amenities_score(property_data)
    roi_result = calculate_roi_score(property_data)

    location_score = location_result["score"]
    connectivity_score = connectivity_result["score"]
    amenities_score = amenities_result["score"]
    roi_score = roi_result["score"]

    # Calculate weighted overall score
    # Weights: location 35%, connectivity 30%, amenities 20%, ROI 15%
    overall_score = (
        (location_score / 100) * 35 +
        (connectivity_score / 100) * 30 +
        (amenities_score / 100) * 20 +
        (roi_score / 100) * 15
    )

    # Overall score is out of 100, but our weights only sum to 100 (not 100 points)
    # So we need to normalize: the max is 35+30+20+15=100, so divide by 100 and multiply by 100
    # Actually, let's recalculate more clearly:
    # overall = (location/100)*35 + (connectivity/100)*30 + (amenities/100)*20 + (roi/100)*15
    # This gives us a score out of 100
    overall_score = (
        location_score * 0.35 +
        connectivity_score * 0.30 +
        amenities_score * 0.20 +
        roi_score * 0.15
    )

    # Round to nearest integer
    overall_score = round(overall_score, 0)

    from datetime import datetime
    timestamp = datetime.utcnow().isoformat() + "Z"

    return {
        "success": True,
        "data": {
            "overall": int(overall_score),
            "locationScore": location_score,
            "connectivityScore": connectivity_score,
            "amenitiesScore": amenities_score,
            "roiPotential": roi_score,
            "breakdown": {
                "location": {
                    **location_result["components"],
                    "reasoning": location_result["reasoning"]
                },
                "connectivity": {
                    **connectivity_result["components"],
                    "reasoning": connectivity_result["reasoning"]
                },
                "amenities": {
                    **amenities_result["components"],
                    "breakdown": amenities_result["breakdown"],
                    "reasoning": amenities_result["reasoning"]
                },
                "roiPotential": {
                    **roi_result["components"],
                    "estimates": roi_result.get("estimates", {}),
                    "reasoning": roi_result["reasoning"]
                }
            },
            "timestamp": timestamp
        }
    }
