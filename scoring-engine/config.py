"""
config.py - Configuration and area knowledge base for Scoring Engine
"""

# Area quality rankings (Mumbai-focused for MVP)
AREA_DATA = {
    "Bandra": {
        "popularity": 28,  # Very popular metro area
        "infrastructure": 20,  # Near highway, good roads
        "safety": 18,  # Relatively safe
        "growth": 12,  # Mature area, slower growth
        "nearby_amenities": 8,  # Schools within 1km
        "average_appreciation": 9.5,  # % YoY growth
        "market_liquidity_days": 45  # Avg days to sell
    },
    "Powai": {
        "popularity": 26,
        "infrastructure": 22,
        "safety": 19,
        "growth": 15,
        "nearby_amenities": 9,
        "average_appreciation": 12.0,
        "market_liquidity_days": 35
    },
    "Thane": {
        "popularity": 18,
        "infrastructure": 16,
        "safety": 16,
        "growth": 14,
        "nearby_amenities": 6,
        "average_appreciation": 8.5,
        "market_liquidity_days": 55
    },
    "Andheri": {
        "popularity": 22,
        "infrastructure": 19,
        "safety": 15,
        "growth": 13,
        "nearby_amenities": 7,
        "average_appreciation": 8.0,
        "market_liquidity_days": 50
    },
    "Navi Mumbai": {
        "popularity": 20,
        "infrastructure": 18,
        "safety": 17,
        "growth": 16,
        "nearby_amenities": 8,
        "average_appreciation": 10.0,
        "market_liquidity_days": 60
    },
    "Default": {  # Fallback for unmapped areas
        "popularity": 20,
        "infrastructure": 18,
        "safety": 16,
        "growth": 12,
        "nearby_amenities": 7,
        "average_appreciation": 8.0,
        "market_liquidity_days": 50
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
    "Default": {
        "nearest_metro": 2.0,
        "highway_distance": 5,
        "business_hub": "City Center",
        "business_hub_distance": 5,
        "airport_distance": 35
    }
}

# Amenity weights and scoring
AMENITY_WEIGHTS = {
    "required": {
        "Parking": 10,
        "Security": 10,
        "Gym": 8,
        "Water Backup": 7,
        "Lift": 5
    },
    "luxury": {
        "Pool": 8,
        "Spa": 6,
        "Concierge": 5,
        "Theater": 4,
        "Garden": 4
    },
    "outdoor": {
        "Garden": 4,
        "Terrace": 4,
        "Balcony": 4,
        "Playground": 4
    }
}

# Rental yield thresholds and points
RENTAL_YIELD_THRESHOLDS = [
    (10.0, 40),      # >= 10% → 40 points
    (8.0, 35),       # 8-10% → 35 points
    (6.0, 30),       # 6-8% → 30 points
    (4.0, 20),       # 4-6% → 20 points
    (0.0, 10)        # < 4% → 10 points
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
