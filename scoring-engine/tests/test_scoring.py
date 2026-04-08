"""
tests/test_scoring.py - Comprehensive test suite for scoring engines

Tests:
1. Location scoring
2. Connectivity scoring
3. Amenities scoring
4. ROI scoring
5. Composite scoring (end-to-end)
6. Expected score ranges for known properties
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engines.location_scorer import calculate_location_score
from engines.connectivity_scorer import calculate_connectivity_score
from engines.amenities_scorer import calculate_amenities_score
from engines.roi_scorer import calculate_roi_score
from engines.composite_scorer import calculate_composite_score


def test_location_scoring_bandra():
    """Test: Bandra should score higher than Thane for location"""
    property_bandra = {
        "location": {"city": "Bandra", "address": "Bandra"}
    }
    property_thane = {
        "location": {"city": "Thane", "address": "Thane"}
    }

    bandra_score = calculate_location_score(property_bandra)["score"]
    thane_score = calculate_location_score(property_thane)["score"]

    assert bandra_score > thane_score, f"Bandra ({bandra_score}) should score higher than Thane ({thane_score})"
    print(f"✓ Location: Bandra {bandra_score} > Thane {thane_score}")


def test_connectivity_scoring():
    """Test: Andheri should score higher than Thane for connectivity (metro access)"""
    property_andheri = {
        "location": {"city": "Andheri", "address": "Andheri"}
    }
    property_thane = {
        "location": {"city": "Thane", "address": "Thane"}
    }

    andheri_score = calculate_connectivity_score(property_andheri)["score"]
    thane_score = calculate_connectivity_score(property_thane)["score"]

    assert andheri_score > thane_score, f"Andheri ({andheri_score}) should score higher than Thane ({thane_score})"
    print(f"✓ Connectivity: Andheri {andheri_score} > Thane {thane_score}")


def test_amenities_with_parking():
    """Test: Property with parking should score higher than without"""
    property_with_parking = {
        "amenities": ["Parking", "Security", "Gym"],
        "specifications": {"age": 5}
    }
    property_without_parking = {
        "amenities": ["Security", "Gym"],
        "specifications": {"age": 5}
    }

    score_with = calculate_amenities_score(property_with_parking)["score"]
    score_without = calculate_amenities_score(property_without_parking)["score"]

    assert score_with > score_without + 8, f"Property with parking ({score_with}) should score much higher than without ({score_without})"
    print(f"✓ Amenities: With parking {score_with} > Without parking {score_without}")


def test_amenities_modern_property():
    """Test: Newer property should score higher for modernization"""
    new_property = {
        "amenities": ["Parking", "Gym"],
        "specifications": {"age": 2}
    }
    old_property = {
        "amenities": ["Parking", "Gym"],
        "specifications": {"age": 15}
    }

    new_score = calculate_amenities_score(new_property)["score"]
    old_score = calculate_amenities_score(old_property)["score"]

    assert new_score > old_score, f"New property ({new_score}) should score higher than old ({old_score})"
    print(f"✓ Amenities: New property {new_score} > Old property {old_score}")


def test_roi_scoring_yield():
    """Test: Higher rental yield should increase ROI score"""
    # Approximate: 8% yield
    high_yield_property = {
        "price": 10000000,  # 1 Cr
        "amenities": [],
        "location": {"city": "Powai"},
        "engagementMetrics": {"views": 20}
    }

    result = calculate_roi_score(high_yield_property)
    rental_yield_score = result["components"]["rentalYield"]

    assert rental_yield_score >= 30, f"8% rental yield should score at least 30, got {rental_yield_score}"
    print(f"✓ ROI: Rental yield score {rental_yield_score} for ~8% yield")


def test_composite_scoring_powai_good_property():
    """Test: Good Powai apartment should score 82-86"""
    property_data = {
        "propertyId": "test_001",
        "propertyType": "Apartment",
        "location": {
            "coordinates": [72.88, 19.08],
            "city": "Powai",
            "address": "Powai"
        },
        "specifications": {
            "bedrooms": 3,
            "bathrooms": 2,
            "carpetAreaSqFt": 1600,
            "floor": 12,
            "totalFloors": 20,
            "age": 5,
            "facing": "East"
        },
        "amenities": ["Parking", "Gym", "Security", "Pool", "Garden"],
        "price": 95000000,  # 95L
        "engagementMetrics": {
            "views": 45,
            "saves": 8,
            "inquiries": 2
        }
    }

    result = calculate_composite_score(property_data)
    overall_score = result["data"]["overall"]

    assert 82 <= overall_score <= 86, f"Powai good property should score 82-86, got {overall_score}"
    print(f"✓ Composite: Powai property scored {overall_score} (expected 82-86)")

    # Verify all breakdowns exist
    breakdown = result["data"]["breakdown"]
    assert "location" in breakdown
    assert "connectivity" in breakdown
    assert "amenities" in breakdown
    assert "roiPotential" in breakdown
    print(f"  Location: {result['data']['locationScore']}")
    print(f"  Connectivity: {result['data']['connectivityScore']}")
    print(f"  Amenities: {result['data']['amenitiesScore']}")
    print(f"  ROI: {result['data']['roiPotential']}")


def test_composite_scoring_bandra_good_property():
    """Test: Good Bandra apartment should score high"""
    property_data = {
        "propertyId": "test_002",
        "propertyType": "Apartment",
        "location": {
            "coordinates": [72.83, 19.05],
            "city": "Bandra",
            "address": "Bandra"
        },
        "specifications": {
            "bedrooms": 3,
            "bathrooms": 2,
            "carpetAreaSqFt": 1600,
            "age": 8,
            "facing": "East"
        },
        "amenities": ["Parking", "Gym", "Security", "Pool"],
        "price": 110000000,
        "engagementMetrics": {
            "views": 45,
            "saves": 8,
            "inquiries": 2
        }
    }

    result = calculate_composite_score(property_data)
    overall_score = result["data"]["overall"]

    assert overall_score >= 80, f"Bandra good property should score at least 80, got {overall_score}"
    print(f"✓ Composite: Bandra property scored {overall_score} (expected >= 80)")


def test_missing_parking_reduces_score():
    """Test: Missing critical amenity (parking) significantly reduces score"""
    property_with_parking = {
        "amenities": ["Parking", "Gym", "Security"],
        "specifications": {"age": 5},
        "location": {"city": "Powai"},
        "price": 95000000,
        "engagementMetrics": {"views": 20}
    }

    property_without_parking = {
        "amenities": ["Gym", "Security"],
        "specifications": {"age": 5},
        "location": {"city": "Powai"},
        "price": 95000000,
        "engagementMetrics": {"views": 20}
    }

    with_parking = calculate_composite_score(property_with_parking)["data"]["overall"]
    without_parking = calculate_composite_score(property_without_parking)["data"]["overall"]

    assert with_parking > without_parking, f"Property with parking ({with_parking}) should score higher than without ({without_parking})"
    print(f"✓ Critical Amenity: With parking {with_parking} > Without parking {without_parking}")


def test_engagement_metrics_affect_roi():
    """Test: High engagement (views) boosts ROI demand trend component"""
    property_low_views = {
        "amenities": [],
        "location": {"city": "Powai"},
        "price": 10000000,
        "engagementMetrics": {"views": 10, "saves": 1, "inquiries": 0}
    }

    property_high_views = {
        "amenities": [],
        "location": {"city": "Powai"},
        "price": 10000000,
        "engagementMetrics": {"views": 50, "saves": 5, "inquiries": 2}
    }

    low_roi = calculate_roi_score(property_low_views)
    high_roi = calculate_roi_score(property_high_views)

    low_demand = low_roi["components"]["demandTrend"]
    high_demand = high_roi["components"]["demandTrend"]

    assert high_demand >= low_demand, f"High engagement should have higher demand trend score"
    print(f"✓ Engagement: Low views demand score {low_demand} vs High views {high_demand}")


def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 SCORING ENGINE TEST SUITE")
    print("="*60 + "\n")

    tests = [
        ("Location Scoring: Bandra > Thane", test_location_scoring_bandra),
        ("Connectivity Scoring", test_connectivity_scoring),
        ("Amenities: Parking Impact", test_amenities_with_parking),
        ("Amenities: Modernization", test_amenities_modern_property),
        ("ROI: Rental Yield", test_roi_scoring_yield),
        ("Composite: Powai Property", test_composite_scoring_powai_good_property),
        ("Composite: Bandra Property", test_composite_scoring_bandra_good_property),
        ("Critical Amenity Impact", test_missing_parking_reduces_score),
        ("Engagement Metrics", test_engagement_metrics_affect_roi),
    ]

    passed = 0
    failed = 0

    for test_name, test_func in tests:
        try:
            print(f"\nTesting: {test_name}")
            test_func()
            passed += 1
        except AssertionError as e:
            print(f"✗ FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ ERROR: {e}")
            failed += 1

    print("\n" + "="*60)
    print(f"📊 Results: {passed} passed, {failed} failed")
    print("="*60 + "\n")

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
