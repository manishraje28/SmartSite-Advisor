"""
verify_scoring_engine.py - Integration tests for Scoring Engine API

Tests the Flask API endpoint /score to ensure:
1. Valid scoring requests return 200 with proper response structure
2. Invalid requests return 400 errors
3. Score ranges are correct
4. All components are included in response
"""

import sys
import json
import time

try:
    import requests
except ImportError:
    print("Error: requests library not found. Install with: pip install requests")
    sys.exit(1)

BASE_URL = "http://localhost:5000"

# Test properties
POWAI_GOOD_PROPERTY = {
    "propertyId": "verify_powai_001",
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
    "price": 95000000,
    "engagementMetrics": {
        "views": 45,
        "saves": 8,
        "inquiries": 2
    }
}

BANDRA_GOOD_PROPERTY = {
    "propertyId": "verify_bandra_001",
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

PROPERTY_NO_PARKING = {
    "propertyId": "verify_noparking_001",
    "propertyType": "Apartment",
    "location": {
        "city": "Powai",
        "address": "Powai"
    },
    "specifications": {
        "bedrooms": 3,
        "age": 5
    },
    "amenities": ["Gym", "Security"],
    "price": 95000000,
    "engagementMetrics": {
        "views": 20
    }
}


def test_log(test_num, name, passed, details=""):
    """Log test result"""
    symbol = "✅" if passed else "❌"
    print(f"{symbol} Test {test_num}: {name}")
    if details:
        print(f"   {details}")


def wait_for_service(max_retries=5):
    """Wait for Flask service to be ready"""
    print("⏳ Waiting for Scoring Engine service on port 5000...")
    for attempt in range(max_retries):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=2)
            if response.status_code == 200:
                print("✅ Service is ready!\n")
                return True
        except:
            if attempt < max_retries - 1:
                print(f"   Attempt {attempt + 1}/{max_retries}... (waiting 1 second)")
                time.sleep(1)

    print(f"❌ Service not responding at {BASE_URL}/health")
    print("   Make sure to run: python app.py")
    return False


def run_tests():
    """Run all integration tests"""
    print("\n" + "="*70)
    print("🧪 SCORING ENGINE API INTEGRATION TESTS")
    print("="*70 + "\n")

    if not wait_for_service():
        return False

    passed = 0
    failed = 0

    # ─────────────────────────────────────────────────────────────────────
    # TEST GROUP 1: Valid scoring requests
    # ─────────────────────────────────────────────────────────────────────
    print("TEST GROUP 1: Valid Scoring Requests")
    print("─" * 70 + "\n")

    try:
        response = requests.post(f"{BASE_URL}/score", json=POWAI_GOOD_PROPERTY)
        result = response.json()
        passed_test = (
            response.status_code == 200 and
            result.get("success") == True and
            "data" in result
        )
        test_log(1, "Score Powai property returns 200", passed_test)
        if passed_test:
            passed += 1
            overall = result["data"]["overall"]
            test_log(2, f"Overall score is in range 82-86", 82 <= overall <= 86,
                    f"Score: {overall}")
            if 82 <= overall <= 86:
                passed += 1
            else:
                failed += 1
        else:
            failed += 1
            test_log(2, "Overall score is in range 82-86", False, "Couldn't get score")
            failed += 1
    except Exception as e:
        test_log(1, "Score Powai property returns 200", False, str(e))
        failed += 2

    try:
        response = requests.post(f"{BASE_URL}/score", json=BANDRA_GOOD_PROPERTY)
        result = response.json()
        passed_test = response.status_code == 200 and result.get("success") == True
        test_log(3, "Score Bandra property returns 200", passed_test)
        if passed_test:
            passed += 1
            overall = result["data"]["overall"]
            test_log(4, f"Bandra score >= 80", overall >= 80,
                    f"Score: {overall}")
            if overall >= 80:
                passed += 1
            else:
                failed += 1
        else:
            failed += 2
    except Exception as e:
        test_log(3, "Score Bandra property returns 200", False, str(e))
        failed += 2

    print()

    # ─────────────────────────────────────────────────────────────────────
    # TEST GROUP 2: Response structure
    # ─────────────────────────────────────────────────────────────────────
    print("TEST GROUP 2: Response Structure")
    print("─" * 70 + "\n")

    try:
        response = requests.post(f"{BASE_URL}/score", json=POWAI_GOOD_PROPERTY)
        result = response.json()
        data = result.get("data", {})

        # Check all required fields
        required_fields = [
            "overall", "locationScore", "connectivityScore",
            "amenitiesScore", "roiPotential", "breakdown", "timestamp"
        ]

        for field in required_fields:
            has_field = field in data
            test_log(5 + required_fields.index(field), f"Has '{field}' field", has_field)
            if has_field:
                passed += 1
            else:
                failed += 1
    except Exception as e:
        test_log(5, "Response structure check", False, str(e))
        failed += len(required_fields)

    print()

    # ─────────────────────────────────────────────────────────────────────
    # TEST GROUP 3: Component breakdowns
    # ─────────────────────────────────────────────────────────────────────
    print("TEST GROUP 3: Component Breakdowns")
    print("─" * 70 + "\n")

    try:
        response = requests.post(f"{BASE_URL}/score", json=POWAI_GOOD_PROPERTY)
        result = response.json()
        breakdown = result["data"]["breakdown"]

        components = ["location", "connectivity", "amenities", "roiPotential"]
        for component in components:
            has_component = component in breakdown
            test_log(12 + components.index(component), f"Breakdown has '{component}'", has_component)
            if has_component:
                passed += 1
                # Check reasoning
                has_reasoning = "reasoning" in breakdown[component]
                test_log(16 + components.index(component), f"  - {component} has reasoning", has_reasoning)
                if has_reasoning:
                    passed += 1
                else:
                    failed += 1
            else:
                failed += 2
    except Exception as e:
        test_log(12, "Component breakdowns check", False, str(e))
        failed += 8

    print()

    # ─────────────────────────────────────────────────────────────────────
    # TEST GROUP 4: Comparative scoring
    # ─────────────────────────────────────────────────────────────────────
    print("TEST GROUP 4: Comparative Scoring")
    print("─" * 70 + "\n")

    try:
        response_with = requests.post(f"{BASE_URL}/score", json=POWAI_GOOD_PROPERTY)
        response_without = requests.post(f"{BASE_URL}/score", json=PROPERTY_NO_PARKING)

        result_with = response_with.json()
        result_without = response_without.json()

        score_with = result_with["data"]["overall"]
        score_without = result_without["data"]["overall"]

        passed_test = score_with > score_without
        test_log(20, "Property with parking scores higher", passed_test,
                f"With parking: {score_with}, Without: {score_without}")
        if passed_test:
            passed += 1
        else:
            failed += 1
    except Exception as e:
        test_log(20, "Comparative scoring", False, str(e))
        failed += 1

    print()

    # ─────────────────────────────────────────────────────────────────────
    # TEST GROUP 5: Error handling
    # ─────────────────────────────────────────────────────────────────────
    print("TEST GROUP 5: Error Handling")
    print("─" * 70 + "\n")

    # Missing location
    try:
        response = requests.post(f"{BASE_URL}/score", json={"price": 1000000})
        passed_test = response.status_code == 400
        test_log(21, "Missing location returns 400", passed_test)
        if passed_test:
            passed += 1
        else:
            failed += 1
    except Exception as e:
        test_log(21, "Missing location returns 400", False, str(e))
        failed += 1

    # Missing city
    try:
        response = requests.post(f"{BASE_URL}/score", json={
            "location": {"address": "Test"},
            "price": 1000000
        })
        passed_test = response.status_code == 400
        test_log(22, "Missing location.city returns 400", passed_test)
        if passed_test:
            passed += 1
        else:
            failed += 1
    except Exception as e:
        test_log(22, "Missing location.city returns 400", False, str(e))
        failed += 1

    # Invalid JSON
    try:
        response = requests.post(f"{BASE_URL}/score", data="invalid json")
        passed_test = response.status_code == 400
        test_log(23, "Invalid JSON returns 400", passed_test)
        if passed_test:
            passed += 1
        else:
            failed += 1
    except Exception as e:
        test_log(23, "Invalid JSON returns 400", False, str(e))
        failed += 1

    print()

    # ─────────────────────────────────────────────────────────────────────
    # Results
    # ─────────────────────────────────────────────────────────────────────
    print("="*70)
    print(f"📊 Results: {passed} passed, {failed} failed")
    print("="*70 + "\n")

    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
