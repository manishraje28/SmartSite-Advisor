"""
engines/location_scorer.py - Location quality scoring

Calculates scores for:
- Area popularity
- Infrastructure quality
- Safety rating
- Future growth potential
- Nearby amenities

Total: 0-100
"""

from config import AREA_DATA, resolve_area_key, MUMBAI_LOCALITIES


def calculate_location_score(property_data: dict) -> dict:
    """
    Calculate location score for a property.

    Args:
        property_data: Property data dict with location info

    Returns:
        {
            "score": 0-100,
            "components": {
                "areaPopularity": 0-30,
                "infrastructureQuality": 0-25,
                "safetyRating": 0-20,
                "futureGrowthPotential": 0-15,
                "nearbyAmenities": 0-10
            },
            "reasoning": "Human-readable explanation"
        }
    """
    location = property_data.get("location", {})
    city = location.get("city", "Unknown")
    address = location.get("address", "Unknown")

    # Resolve by locality (matched from the address) first, since that's what
    # actually differentiates quality within a city — falls back to city-level,
    # then "Default", only when no known locality is recognized.
    area_key = resolve_area_key(location, AREA_DATA)
    area_config = AREA_DATA[area_key]

    components = {
        "areaPopularity": area_config["popularity"],
        "infrastructureQuality": area_config["infrastructure"],
        "safetyRating": area_config["safety"],
        "futureGrowthPotential": area_config["growth"],
        "nearbyAmenities": area_config["nearby_amenities"]
    }

    # Calculate total score
    total_score = sum(components.values())

    # Generate reasoning
    reasoning = f"{address} ({city}) is "
    if components["areaPopularity"] >= 25:
        reasoning += "very popular "
    elif components["areaPopularity"] >= 20:
        reasoning += "popular "
    else:
        reasoning += "moderately popular "

    reasoning += "with "
    if components["infrastructureQuality"] >= 20:
        reasoning += "good infrastructure"
    else:
        reasoning += "moderate infrastructure"

    safety_source = (
        "NCRB's official Crime in India 2022 report for Mumbai city"
        if area_key in MUMBAI_LOCALITIES
        else "the national average crime rate (NCRB Crime in India 2022) since no separate official figure exists for this city"
    )
    reasoning += f". Safety rating is {'good' if components['safetyRating'] >= 17 else 'moderate'}, based on {safety_source}. "
    reasoning += f"Growth potential is {'high' if components['futureGrowthPotential'] >= 14 else 'moderate'}. "

    return {
        "score": total_score,
        "components": components,
        "reasoning": reasoning
    }
