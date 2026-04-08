"""
engines/connectivity_scorer.py - Connectivity scoring

Calculates scores for:
- Public transport access (metro/bus distance)
- Car access (highway proximity)
- Business hub proximity
- Airport access

Total: 0-100
"""

from config import INFRASTRUCTURE_DISTANCES


def calculate_connectivity_score(property_data: dict) -> dict:
    """
    Calculate connectivity score for a property.

    Args:
        property_data: Property data dict with location info

    Returns:
        {
            "score": 0-100,
            "components": {
                "publicTransport": 0-40,
                "carAccess": 0-25,
                "businessHubProximity": 0-20,
                "airportAccess": 0-15
            },
            "reasoning": "Human-readable explanation"
        }
    """
    location = property_data.get("location", {})
    city = location.get("city", "Unknown")

    # Get infrastructure data
    infra = INFRASTRUCTURE_DISTANCES.get(city, INFRASTRUCTURE_DISTANCES.get("Default"))

    metro_dist = infra["nearest_metro"]
    highway_dist = infra["highway_distance"]
    business_hub_dist = infra["business_hub_distance"]
    airport_dist = infra["airport_distance"]

    # Calculate public transport score (0-40)
    if metro_dist < 0.5:
        public_transport_score = 40
    elif metro_dist < 2:
        public_transport_score = 35
    elif metro_dist < 3:
        public_transport_score = 30
    else:
        public_transport_score = 10

    # Calculate car access score (0-25)
    # Assuming highway distance roughly correlates to time
    if highway_dist < 5:
        car_access_score = 25
    elif highway_dist < 10:
        car_access_score = 20
    elif highway_dist < 15:
        car_access_score = 15
    else:
        car_access_score = 8

    # Calculate business hub proximity score (0-20)
    if business_hub_dist < 1:
        business_hub_score = 20
    elif business_hub_dist < 5:
        business_hub_score = 18
    elif business_hub_dist < 10:
        business_hub_score = 10
    else:
        business_hub_score = 4

    # Calculate airport access score (0-15)
    # Rough conversion: 1km ≈ 1.5 min in city traffic
    airport_time_min = airport_dist * 1.5
    if airport_time_min < 30:
        airport_score = 15
    elif airport_time_min < 45:
        airport_score = 12
    elif airport_time_min < 60:
        airport_score = 10
    else:
        airport_score = 2

    components = {
        "publicTransport": public_transport_score,
        "carAccess": car_access_score,
        "businessHubProximity": business_hub_score,
        "airportAccess": airport_score
    }

    total_score = sum(components.values())

    # Generate reasoning
    metro_status = "excellent" if metro_dist < 0.5 else "good" if metro_dist < 2 else "moderate"
    highway_status = "excellent" if highway_dist < 5 else "good" if highway_dist < 10 else "fair"

    reasoning = (
        f"Metro/bus access is {metro_status} ({metro_dist:.1f}km away). "
        f"Highway access is {highway_status} ({highway_dist}km away). "
        f"{infra['business_hub']} is {business_hub_dist}km away. "
        f"Airport is approximately {airport_dist}km ({int(airport_time_min)} min by road)."
    )

    return {
        "score": total_score,
        "components": components,
        "reasoning": reasoning
    }
