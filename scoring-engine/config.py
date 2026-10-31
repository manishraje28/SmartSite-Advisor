"""
config.py - Configuration and area knowledge base for Scoring Engine
"""


# Bare city names in the knowledge base — these are catch-all buckets, not real
# localities. "Navi Mumbai" would otherwise match before "Kharghar" or "Vashi"
# (both localities within it) purely because of dict insertion order, so locality
# keys must always get first shot at matching before these are considered.
CITY_LEVEL_KEYS = {"Mumbai", "Thane", "Navi Mumbai"}


# ── Real Crime Data (Safety Sub-Score) ──────────────────────────────────────
# Source: NCRB "Crime in India 2022" — the government's official annual crime
# statistics (National Crime Records Bureau, Ministry of Home Affairs).
#
# NCRB only tracks total cognizable-crime rate (per 1,00,000 population) for
# its 19 tracked "million-plus cities" (Census-2011 population > 2M). Of our
# three target cities, only Mumbai is in that list — Thane and Navi Mumbai are
# not tracked as separate cities in NCRB's own reporting, so there is no
# official city-specific rate for them. NCRB also doesn't publish anything
# below city level, so even within Mumbai there's no official way to say
# Bandra is safer than Andheri — every Mumbai locality below honestly shares
# one real, city-wide number rather than a fabricated per-neighborhood delta.
#
# Figures used (crimes per 1,00,000 population, 2022):
#   Mumbai:           367.3  (NCRB Crime in India 2022, 19-metro-city table,
#                              via https://www.orfonline.org/expert-speak/crime-in-india-s-largest-cities-an-analysis)
#   National average: 422.2  (NCRB Crime in India 2022, all-India total)
#   Normalization range: Kolkata 78.2 (safest of the 19 tracked metros) —
#                         Delhi 1832.6 (least safe of the 19 tracked metros)
#
# Thane and Navi Mumbai use the NATIONAL AVERAGE as an honest fallback (a
# real published government figure, just not city-specific) until a
# Maharashtra-Police-published, commissionerate-level number becomes
# available for them.
_MUMBAI_CRIME_RATE_PER_LAKH = 367.3
_NATIONAL_AVG_CRIME_RATE_PER_LAKH = 422.2
_SAFEST_METRO_CRIME_RATE_PER_LAKH = 78.2      # Kolkata, 2022
_LEAST_SAFE_METRO_CRIME_RATE_PER_LAKH = 1832.6  # Delhi, 2022


def _safety_score_from_crime_rate(crime_rate_per_lakh: float) -> int:
    """Converts a real NCRB crime-rate-per-lakh figure into this engine's
    0-20 safety sub-score (higher = safer), normalized against the spread of
    NCRB's own 19 tracked metro cities so the number means something in
    context instead of being an arbitrary unit conversion."""
    span = _LEAST_SAFE_METRO_CRIME_RATE_PER_LAKH - _SAFEST_METRO_CRIME_RATE_PER_LAKH
    normalized = (_LEAST_SAFE_METRO_CRIME_RATE_PER_LAKH - crime_rate_per_lakh) / span
    return round(max(0.0, min(1.0, normalized)) * 20)


MUMBAI_SAFETY_SCORE = _safety_score_from_crime_rate(_MUMBAI_CRIME_RATE_PER_LAKH)
FALLBACK_SAFETY_SCORE = _safety_score_from_crime_rate(_NATIONAL_AVG_CRIME_RATE_PER_LAKH)

# Localities that share Mumbai's real, official crime rate (vs. the national-
# average fallback used by Thane/Navi Mumbai localities) — used by
# location_scorer.py to cite the correct source in its reasoning text.
MUMBAI_LOCALITIES = {"Bandra", "Powai", "Andheri", "Juhu", "Worli", "Lower Parel", "Borivali", "Mumbai"}


def resolve_area_key(location: dict, area_dict: dict) -> str:
    """
    Resolves which knowledge-base entry applies to a property's location.

    Property.location.city holds the CITY ("Mumbai", "Thane", "Navi Mumbai"),
    not the locality — but this knowledge base is keyed by locality ("Bandra",
    "Juhu", "Powai", ...) since that's what actually differentiates quality within
    a city. Looking up by city directly would send nearly every Mumbai property
    to the same generic "Default"/"Mumbai" bucket regardless of neighborhood.

    So: try to find a known locality name inside the address string first (this
    gives real differentiation for properties whose address names Juhu, Powai,
    Kharghar, etc). Only fall back to a city-level entry, then "Default", when no
    locality is recognized.
    """
    address = (location.get("address") or "").lower()
    city = location.get("city") or ""

    for key in area_dict:
        if key == "Default" or key in CITY_LEVEL_KEYS:
            continue
        if key.lower() in address:
            return key

    for key in CITY_LEVEL_KEYS:
        if key in area_dict and (key.lower() in address or key == city):
            return key

    if city in area_dict:
        return city

    return "Default"


# Area quality rankings (Mumbai-focused for MVP)
AREA_DATA = {
    "Bandra": {
        "popularity": 28,  # Very popular metro area
        "infrastructure": 20,  # Near highway, good roads
        "safety": MUMBAI_SAFETY_SCORE,  # NCRB Crime in India 2022 — Mumbai city rate
        "growth": 12,  # Mature area, slower growth
        "nearby_amenities": 8,  # Schools within 1km
        "average_appreciation": 9.5,  # % YoY growth
        "market_liquidity_days": 45,  # Avg days to sell
        "rental_yield_pct": 2.3
    },
    "Powai": {
        "popularity": 26,
        "infrastructure": 22,
        "safety": MUMBAI_SAFETY_SCORE,  # NCRB Crime in India 2022 — Mumbai city rate
        "growth": 15,
        "nearby_amenities": 9,
        "average_appreciation": 12.0,
        "market_liquidity_days": 35,
        "rental_yield_pct": 2.9
    },
    "Thane": {
        "popularity": 18,
        "infrastructure": 16,
        "safety": FALLBACK_SAFETY_SCORE,  # No separate NCRB city figure — national average used
        "growth": 14,
        "nearby_amenities": 6,
        "average_appreciation": 8.5,
        "market_liquidity_days": 55,
        "rental_yield_pct": 3.3
    },
    "Andheri": {
        "popularity": 22,
        "infrastructure": 19,
        "safety": MUMBAI_SAFETY_SCORE,  # NCRB Crime in India 2022 — Mumbai city rate
        "growth": 13,
        "nearby_amenities": 7,
        "average_appreciation": 8.0,
        "market_liquidity_days": 50,
        "rental_yield_pct": 2.8
    },
    "Navi Mumbai": {
        "popularity": 20,
        "infrastructure": 18,
        "safety": FALLBACK_SAFETY_SCORE,  # No separate NCRB city figure — national average used
        "growth": 16,
        "nearby_amenities": 8,
        "average_appreciation": 10.0,
        "market_liquidity_days": 60,
        "rental_yield_pct": 3.4
    },
    "Juhu": {
        "popularity": 27,
        "infrastructure": 19,
        "safety": MUMBAI_SAFETY_SCORE,  # NCRB Crime in India 2022 — Mumbai city rate
        "growth": 10,
        "nearby_amenities": 9,
        "average_appreciation": 8.5,
        "market_liquidity_days": 50,
        "rental_yield_pct": 2.2
    },
    "Worli": {
        "popularity": 27,
        "infrastructure": 21,
        "safety": MUMBAI_SAFETY_SCORE,  # NCRB Crime in India 2022 — Mumbai city rate
        "growth": 11,
        "nearby_amenities": 8,
        "average_appreciation": 9.0,
        "market_liquidity_days": 45,
        "rental_yield_pct": 2.4
    },
    "Lower Parel": {
        "popularity": 26,
        "infrastructure": 22,
        "safety": MUMBAI_SAFETY_SCORE,  # NCRB Crime in India 2022 — Mumbai city rate
        "growth": 12,
        "nearby_amenities": 9,
        "average_appreciation": 9.5,
        "market_liquidity_days": 40,
        "rental_yield_pct": 2.6
    },
    "Borivali": {
        "popularity": 21,
        "infrastructure": 19,
        "safety": MUMBAI_SAFETY_SCORE,  # NCRB Crime in India 2022 — Mumbai city rate
        "growth": 13,
        "nearby_amenities": 8,
        "average_appreciation": 9.0,
        "market_liquidity_days": 48,
        "rental_yield_pct": 3.0
    },
    "Kharghar": {
        "popularity": 18,
        "infrastructure": 16,
        "safety": FALLBACK_SAFETY_SCORE,  # No separate NCRB city figure — national average used
        "growth": 17,
        "nearby_amenities": 7,
        "average_appreciation": 11.5,
        "market_liquidity_days": 55,
        "rental_yield_pct": 3.6
    },
    "Vashi": {
        "popularity": 21,
        "infrastructure": 20,
        "safety": FALLBACK_SAFETY_SCORE,  # No separate NCRB city figure — national average used
        "growth": 14,
        "nearby_amenities": 8,
        "average_appreciation": 9.5,
        "market_liquidity_days": 45,
        "rental_yield_pct": 3.3
    },
    "Seawoods": {
        "popularity": 22,
        "infrastructure": 21,
        "safety": FALLBACK_SAFETY_SCORE,  # No separate NCRB city figure — national average used
        "growth": 15,
        "nearby_amenities": 9,
        "average_appreciation": 9.5,
        "market_liquidity_days": 40,
        "rental_yield_pct": 3.2
    },
    "Ghodbunder Road": {
        "popularity": 19,
        "infrastructure": 17,
        "safety": FALLBACK_SAFETY_SCORE,  # No separate NCRB city figure — national average used
        "growth": 15,
        "nearby_amenities": 7,
        "average_appreciation": 9.0,
        "market_liquidity_days": 50,
        "rental_yield_pct": 3.5
    },
    "Mumbai": {  # City-level fallback for Mumbai addresses whose locality isn't in the table above
        "popularity": 22,
        "infrastructure": 19,
        "safety": MUMBAI_SAFETY_SCORE,  # NCRB Crime in India 2022 — Mumbai city rate
        "growth": 12,
        "nearby_amenities": 8,
        "average_appreciation": 9.0,
        "market_liquidity_days": 48,
        "rental_yield_pct": 2.6
    },
    "Default": {  # Fallback for unmapped areas
        "popularity": 20,
        "infrastructure": 18,
        "safety": FALLBACK_SAFETY_SCORE,  # No city recognized — national average used
        "growth": 12,
        "nearby_amenities": 7,
        "average_appreciation": 8.0,
        "market_liquidity_days": 50,
        "rental_yield_pct": 3.0
    }
}

# Infrastructure distances (in km) for different areas
INFRASTRUCTURE_DISTANCES = {
    "Bandra": {
        "nearest_metro": 0.5,
        "highway_distance": 3,
        "business_hub": "Bandra Kurla Complex",
        "business_hub_distance": 2,
        "airport_distance": 25
    },
    "Powai": {
        "nearest_metro": 0.8,
        "highway_distance": 2,
        "business_hub": "Powai IT Park",
        "business_hub_distance": 0.5,
        "airport_distance": 22
    },
    "Thane": {
        "nearest_metro": 1.5,
        "highway_distance": 1,
        "business_hub": "Thane CBD",
        "business_hub_distance": 3,
        "airport_distance": 40
    },
    "Andheri": {
        "nearest_metro": 0.3,
        "highway_distance": 4,
        "business_hub": "JVLR",
        "business_hub_distance": 2,
        "airport_distance": 15
    },
    "Juhu": {
        "nearest_metro": 2.5,
        "highway_distance": 3,
        "business_hub": "Bandra Kurla Complex",
        "business_hub_distance": 6,
        "airport_distance": 8
    },
    "Worli": {
        "nearest_metro": 1.0,
        "highway_distance": 1,
        "business_hub": "Bandra Kurla Complex",
        "business_hub_distance": 5,
        "airport_distance": 22
    },
    "Lower Parel": {
        "nearest_metro": 0.5,
        "highway_distance": 2,
        "business_hub": "Lower Parel Business District",
        "business_hub_distance": 0.5,
        "airport_distance": 20
    },
    "Borivali": {
        "nearest_metro": 1.2,
        "highway_distance": 1,
        "business_hub": "BKC",
        "business_hub_distance": 20,
        "airport_distance": 12
    },
    "Kharghar": {
        "nearest_metro": 1.5,
        "highway_distance": 2,
        "business_hub": "Kharghar Business Hub",
        "business_hub_distance": 3,
        "airport_distance": 18
    },
    "Vashi": {
        "nearest_metro": 0.8,
        "highway_distance": 1.5,
        "business_hub": "Vashi Business District",
        "business_hub_distance": 2,
        "airport_distance": 15
    },
    "Seawoods": {
        "nearest_metro": 0.3,
        "highway_distance": 1,
        "business_hub": "Seawoods Grand Central",
        "business_hub_distance": 0.5,
        "airport_distance": 14
    },
    "Ghodbunder Road": {
        "nearest_metro": 3.0,
        "highway_distance": 1,
        "business_hub": "Thane CBD",
        "business_hub_distance": 8,
        "airport_distance": 42
    },
    "Mumbai": {  # City-level fallback for Mumbai addresses whose locality isn't in the table above
        "nearest_metro": 1.5,
        "highway_distance": 3,
        "business_hub": "Bandra Kurla Complex",
        "business_hub_distance": 10,
        "airport_distance": 20
    },
    "Navi Mumbai": {
        "nearest_metro": 1.2,
        "highway_distance": 2,
        "business_hub": "Vashi Business District",
        "business_hub_distance": 8,
        "airport_distance": 16
    },
    "Default": {
        "nearest_metro": 2.0,
        "highway_distance": 5,
        "business_hub": "City Center",
        "business_hub_distance": 5,
        "airport_distance": 35
    }
}

# Amenity weights and scoring.
# NOTE: these keys are matched (case-insensitively) against the Property schema's
# fixed amenities enum (backend/src/models/Property.js) — a label here that doesn't
# match a real enum value can never score, so keep these in sync with that list.
AMENITY_WEIGHTS = {
    "required": {
        "Parking": 10,
        "Security": 10,
        "Gym": 8,
        "Power Backup": 7,
        "Lift": 5
    },
    "luxury": {
        "Swimming Pool": 10,
        "Clubhouse": 8,
        "Tennis Court": 6,
        "Basketball Court": 4,
        "Solar Panels": 2
    },
    "outdoor": {
        "Garden": 8,
        "Jogging Track": 6,
        "Children Play Area": 6
    }
}

# Rental yield thresholds and points.
# Calibrated to realistic Indian residential gross rental yields (typically 1.5-4%,
# rarely 6%+) — thresholds tuned so the AREA_DATA rental_yield_pct values (2.2-3.6%)
# actually spread across the score range instead of all collapsing into one bucket.
RENTAL_YIELD_THRESHOLDS = [
    (3.5, 40),       # >= 3.5% → 40 points
    (3.0, 32),       # 3-3.5% → 32 points
    (2.5, 24),       # 2.5-3% → 24 points
    (2.0, 16),       # 2-2.5% → 16 points
    (0.0, 8)         # < 2% → 8 points
]

# Appreciation potential by area growth rate
APPRECIATION_THRESHOLDS = [
    (12.0, 35),      # >= 12% YoY → 32-35 points
    (8.0, 30),       # 8-10% → 28-30 points
    (5.0, 20),       # < 5% → 15-20 points
    (0.0, 15)
]

# Market liquidity (days to sell) scoring
LIQUIDITY_THRESHOLDS = [
    (30, 20),        # < 30 days → 20 points
    (45, 18),        # 30-45 → 18 points
    (60, 15),        # 45-60 → 15 points
    (90, 10),        # 60-90 → 10 points
    (99999, 5)       # > 90 → 5 points
]
