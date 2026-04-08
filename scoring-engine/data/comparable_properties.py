"""
data/comparable_properties.py - Mock comparable properties for similar property analysis
"""

# Mock comparable properties in different areas
COMPARABLE_PROPERTIES = {
    "Bandra": [
        {
            "id": "comp_bandra_001",
            "property_type": "Apartment",
            "bedrooms": 3,
            "carpet_area": 1600,
            "price": 11000000,  # 1.1 Cr
            "price_per_sqft": 6875,
            "rent_per_month": 150000,
            "sold_date": "2026-03-15"
        },
        {
            "id": "comp_bandra_002",
            "property_type": "Apartment",
            "bedrooms": 3,
            "carpet_area": 1550,
            "price": 10800000,
            "price_per_sqft": 6968,
            "rent_per_month": 145000,
            "sold_date": "2026-02-20"
        },
        {
            "id": "comp_bandra_003",
            "property_type": "Apartment",
            "bedrooms": 2,
            "carpet_area": 1200,
            "price": 8500000,
            "price_per_sqft": 7083,
            "rent_per_month": 110000,
            "sold_date": "2026-01-30"
        },
        {
            "id": "comp_bandra_004",
            "property_type": "Apartment",
            "bedrooms": 4,
            "carpet_area": 2000,
            "price": 13500000,
            "price_per_sqft": 6750,
            "rent_per_month": 180000,
            "sold_date": "2026-03-05"
        }
    ],
    "Powai": [
        {
            "id": "comp_powai_001",
            "property_type": "Apartment",
            "bedrooms": 3,
            "carpet_area": 1600,
            "price": 9500000,
            "price_per_sqft": 5938,
            "rent_per_month": 130000,
            "sold_date": "2026-03-10"
        },
        {
            "id": "comp_powai_002",
            "property_type": "Apartment",
            "bedrooms": 3,
            "carpet_area": 1650,
            "price": 9800000,
            "price_per_sqft": 5939,
            "rent_per_month": 135000,
            "sold_date": "2026-02-25"
        },
        {
            "id": "comp_powai_003",
            "property_type": "Apartment",
            "bedrooms": 2,
            "carpet_area": 1200,
            "price": 7200000,
            "price_per_sqft": 6000,
            "rent_per_month": 100000,
            "sold_date": "2026-03-01"
        }
    ],
    "Thane": [
        {
            "id": "comp_thane_001",
            "property_type": "Apartment",
            "bedrooms": 3,
            "carpet_area": 1550,
            "price": 7800000,
            "price_per_sqft": 5032,
            "rent_per_month": 90000,
            "sold_date": "2026-02-28"
        },
        {
            "id": "comp_thane_002",
            "property_type": "Apartment",
            "bedrooms": 3,
            "carpet_area": 1600,
            "price": 8000000,
            "price_per_sqft": 5000,
            "rent_per_month": 92000,
            "sold_date": "2026-03-08"
        }
    ],
    "Andheri": [
        {
            "id": "comp_andheri_001",
            "property_type": "Apartment",
            "bedrooms": 3,
            "carpet_area": 1500,
            "price": 8200000,
            "price_per_sqft": 5467,
            "rent_per_month": 105000,
            "sold_date": "2026-03-05"
        },
        {
            "id": "comp_andheri_002",
            "property_type": "Apartment",
            "bedrooms": 2,
            "carpet_area": 1100,
            "price": 6500000,
            "price_per_sqft": 5909,
            "rent_per_month": 85000,
            "sold_date": "2026-02-15"
        }
    ]
}

def get_comparable_properties(city, property_type, bedrooms=None, carpet_area=None, tolerance_pct=0.2):
    """
    Retrieve comparable properties for a given area and property type.

    Args:
        city: City/area name (e.g., 'Bandra', 'Powai')
        property_type: Type of property (e.g., 'Apartment', 'Villa')
        bedrooms: Target bedroom count (optional)
        carpet_area: Target carpet area (optional)
        tolerance_pct: Tolerance for filtering similar properties (default 20%)

    Returns:
        List of comparable properties matching criteria
    """
    comps = COMPARABLE_PROPERTIES.get(city, COMPARABLE_PROPERTIES.get("Bandra"))

    if not comps:
        return []

    # Filter by property type
    filtered = [p for p in comps if p["property_type"] == property_type]

    # Filter by bedroom count (if specified)
    if bedrooms:
        filtered = [p for p in filtered if abs(p["bedrooms"] - bedrooms) <= 1]

    # Filter by carpet area (if specified)
    if carpet_area:
        min_area = carpet_area * (1 - tolerance_pct)
        max_area = carpet_area * (1 + tolerance_pct)
        filtered = [p for p in filtered if min_area <= p["carpet_area"] <= max_area]

    return filtered
