"""
app.py - Flask REST API for Scoring Engine

Endpoint: POST /score
Accepts property data and returns detailed multi-factor quality scores
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from engines.composite_scorer import calculate_composite_score

app = Flask(__name__)
CORS(app)


@app.route('/score', methods=['POST'])
def score_property():
    """
    Score a property based on multi-factor analysis.

    Request JSON:
    {
        "propertyId": "507f1f77bcf86cd799439011",
        "propertyType": "Apartment",
        "location": {
            "coordinates": [72.88, 19.08],
            "city": "Mumbai",
            "address": "Bandra"
        },
        "specifications": {
            "bedrooms": 3,
            "bathrooms": 2,
            "carpetAreaSqFt": 1600,
            "floor": 12,
            "totalFloors": 20,
            "age": 8,
            "facing": "East"
        },
        "amenities": ["Parking", "Gym", "Security", "Pool", "Garden"],
        "price": 110000000,
        "engagementMetrics": {
            "views": 45,
            "saves": 8,
            "inquiries": 2
        }
    }

    Response: 200 OK with scoring breakdown
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Request must be JSON"
            }), 400

        property_data = request.get_json()

        # Validate required fields
        if not property_data.get("location"):
            return jsonify({
                "success": False,
                "error": "Missing required field: location"
            }), 400

        if not property_data.get("location").get("city"):
            return jsonify({
                "success": False,
                "error": "Missing required field: location.city"
            }), 400

        # Ensure default values for optional fields
        if "amenities" not in property_data:
            property_data["amenities"] = []
        if "engagementMetrics" not in property_data:
            property_data["engagementMetrics"] = {"views": 0, "saves": 0, "inquiries": 0}
        if "specifications" not in property_data:
            property_data["specifications"] = {}
        if "price" not in property_data:
            property_data["price"] = 0

        # Calculate composite score
        result = calculate_composite_score(property_data)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "scoring-engine"}), 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "success": False,
        "error": "Endpoint not found. Use POST /score"
    }), 404


if __name__ == '__main__':
    # Run Flask app on port 5001 (port 5000 may have conflicts)
    app.run(debug=True, host='0.0.0.0', port=5001)
