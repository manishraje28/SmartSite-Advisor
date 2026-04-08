"""
engines/amenities_scorer.py - Amenities scoring

Calculates scores for:
- Required amenities (parking, security, gym, water backup, lift)
- Luxury amenities (pool, spa, concierge, theater)
- Outdoor spaces (garden, terrace, balcony, playground)
- Modernization (age, renovation status)

Total: 0-100
"""

from config import AMENITY_WEIGHTS


def calculate_amenities_score(property_data: dict) -> dict:
    """
    Calculate amenities score for a property.

    Args:
        property_data: Property data dict with amenities list and age

    Returns:
        {
            "score": 0-100,
            "components": {
                "requiredAmenities": 0-40,
                "luxuryAmenities": 0-30,
                "outdoorSpaces": 0-20,
                "modernization": 0-10
            },
            "breakdown": {
                "required": ["Parking", "Security", ...],
                "luxury": ["Pool", ...],
                "outdoor": ["Garden", ...]
            },
            "reasoning": "Human-readable explanation"
        }
    """
    amenities_list = property_data.get("amenities", [])
    specifications = property_data.get("specifications", {})
    age = specifications.get("age", 10)
    facing = specifications.get("facing", "")

    # Convert amenities list to uppercase for matching
    amenities_upper = [a.upper() for a in amenities_list]

    # Calculate required amenities score (0-40)
    required_score = 0
    required_found = []
    for amenity, weight in AMENITY_WEIGHTS["required"].items():
        if amenity.upper() in amenities_upper:
            required_score += weight
            required_found.append(amenity)
    # Cap at 40
    required_score = min(required_score, 40)

    # Calculate luxury amenities score (0-30)
    luxury_score = 0
    luxury_found = []
    for amenity, weight in AMENITY_WEIGHTS["luxury"].items():
        if amenity.upper() in amenities_upper:
            luxury_score += weight
            luxury_found.append(amenity)
    # Add combo bonus if Pool + Spa both present
    if "POOL" in amenities_upper and "SPA" in amenities_upper:
        luxury_score += 2
    # Cap at 30
    luxury_score = min(luxury_score, 30)

    # Calculate outdoor spaces score (0-20)
    outdoor_score = 0
    outdoor_found = []
    for amenity, weight in AMENITY_WEIGHTS["outdoor"].items():
        if amenity.upper() in amenities_upper:
            outdoor_score += weight
            outdoor_found.append(amenity)
    # Add facing bonus (East/North = better natural light)
    if facing.upper() in ["EAST", "NORTH"]:
        outdoor_score += 3
    # Cap at 20
    outdoor_score = min(outdoor_score, 20)

    # Calculate modernization score (0-10)
    if age < 3:
        modern_score = 10
    elif age <= 7:
        modern_score = 8
    else:
        modern_score = 3
    # Add renovation bonus if property is well-maintained (proxy: has many amenities)
    if len(amenities_list) >= 5:
        modern_score = min(modern_score + 2, 10)

    components = {
        "requiredAmenities": required_score,
        "luxuryAmenities": luxury_score,
        "outdoorSpaces": outdoor_score,
        "modernization": modern_score
    }

    total_score = sum(components.values())

    # Generate reasoning
    missing_critical = []
    for amenity in ["Parking", "Security"]:
        if amenity.upper() not in amenities_upper:
            missing_critical.append(amenity)

    reasoning = ""
    if missing_critical:
        reasoning += f"Missing critical amenities: {', '.join(missing_critical)}. "
    else:
        reasoning += "Has all critical amenities (parking, security). "

    if luxury_found:
        reasoning += f"Includes luxury amenities: {', '.join(luxury_found)}. "

    if outdoor_found:
        reasoning += f"Good outdoor spaces: {', '.join(outdoor_found)}. "

    if age < 5:
        reasoning += f"Property is relatively new ({age} years old)."
    elif age < 10:
        reasoning += f"Property is {age} years old, reasonably maintained."
    else:
        reasoning += f"Property is older ({age} years), may need updates."

    return {
        "score": total_score,
        "components": components,
        "breakdown": {
            "required": required_found,
            "luxury": luxury_found,
            "outdoor": outdoor_found
        },
        "reasoning": reasoning
    }
