"""
engines/roi_scorer.py - ROI Potential scoring

Calculates scores for:
- Rental yield (annual rent %)
- Appreciation potential (yearly growth estimate)
- Market liquidity (days to sell)
- Demand trend (current buyer interest vs area average)

Total: 0-100
"""

from config import AREA_DATA, RENTAL_YIELD_THRESHOLDS, APPRECIATION_THRESHOLDS, LIQUIDITY_THRESHOLDS


def calculate_roi_score(property_data: dict) -> dict:
    """
    Calculate ROI potential score for a property.

    Args:
        property_data: Property data dict with price, location, engagement metrics

    Returns:
        {
            "score": 0-100,
            "components": {
                "rentalYield": 0-40,
                "appreciationPotential": 0-35,
                "marketLiquidity": 0-20,
                "demandTrend": 0-5
            },
            "reasoning": "Human-readable explanation"
        }
    """
    price = property_data.get("price", 0)
    location = property_data.get("location", {})
    city = location.get("city", "Unknown")
    engagement = property_data.get("engagementMetrics", {})

    # Get area data for appreciation potential
    area_config = AREA_DATA.get(city, AREA_DATA.get("Default"))
    appreciation_pct = area_config["average_appreciation"]
    liquidity_days = area_config["market_liquidity_days"]

    # Get rental estimate from property data or calculate
    # For MVP, we'll use a simple formula: estimated rent = price * 1.2% / 12
    estimated_annual_rent = price * 0.012
    if estimated_annual_rent == 0:
        estimated_annual_rent = 100000  # Default fallback

    # Calculate rental yield (0-40)
    rental_yield_pct = (estimated_annual_rent / price * 100) if price > 0 else 0

    rental_yield_score = 10  # Default
    for threshold, score in RENTAL_YIELD_THRESHOLDS:
        if rental_yield_pct >= threshold:
            rental_yield_score = score
            break

    # Calculate appreciation potential (0-35)
    appreciation_score = 15  # Default
    for threshold, score in APPRECIATION_THRESHOLDS:
        if appreciation_pct >= threshold:
            appreciation_score = score
            break

    # Calculate market liquidity score (0-20)
    liquidity_score = 5  # Default
    for threshold, score in LIQUIDITY_THRESHOLDS:
        if liquidity_days < threshold:
            liquidity_score = score
            break

    # Calculate demand trend score (0-5)
    # Use engagement metrics: views vs area average assumption
    views = engagement.get("views", 0)
    area_avg_views = 30  # Assumed average for a property
    demand_bonus = 0
    if views > area_avg_views * 1.3:
        demand_bonus = 5
    elif views > area_avg_views:
        demand_bonus = 3
    else:
        demand_bonus = 0

    demand_trend_score = min(demand_bonus, 5)

    components = {
        "rentalYield": rental_yield_score,
        "appreciationPotential": appreciation_score,
        "marketLiquidity": liquidity_score,
        "demandTrend": demand_trend_score
    }

    total_score = sum(components.values())

    # Generate reasoning
    yield_status = "excellent" if rental_yield_pct >= 10 else "good" if rental_yield_pct >= 6 else "moderate"
    growth_status = "high" if appreciation_pct >= 12 else "good" if appreciation_pct >= 8 else "moderate"
    liquidity_status = "fast" if liquidity_days <= 30 else "moderate" if liquidity_days <= 60 else "slow"

    reasoning = (
        f"Estimated rental yield is {yield_status} ({rental_yield_pct:.1f}%). "
        f"Area appreciation potential is {growth_status} ({appreciation_pct:.1f}% YoY). "
        f"Market liquidity is {liquidity_status} (avg {liquidity_days} days to sell). "
    )

    if views > area_avg_views:
        reasoning += f"Property has above-average views ({views} vs {area_avg_views} avg)."
    else:
        reasoning += f"Property has moderate interest ({views} views)."

    return {
        "score": total_score,
        "components": components,
        "estimates": {
            "rentalYieldPercent": round(rental_yield_pct, 2),
            "appreciationPercentYoY": appreciation_pct,
            "marketLiquidityDays": liquidity_days,
            "estimatedAnnualRent": int(estimated_annual_rent)
        },
        "reasoning": reasoning
    }
