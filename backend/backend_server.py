from flask import Flask, jsonify
from flask_cors import CORS # Import CORS to allow cross-origin requests
import os
import datetime

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Mock Data Generation (Simulates AI processing results and image storage) ---
# In a real scenario, these would come from your drone's image processing
# and a database. For the hackathon, this hardcoded data serves the purpose.

MOCK_IMAGE_BASE_URL = "https://via.placeholder.com/800x600/D3D3D3/000000?text=Drone+Image+"

def generate_mock_image_data(image_id):
    """Generates mock data for a single image capture."""
    return {
        "id": f"img_{image_id}",
        # In a real app, this URL would point to your S3 bucket or similar
        "imageUrl": f"{MOCK_IMAGE_BASE_URL}{image_id}",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "droneLat": 18.59 + (image_id * 0.0001), # Slightly vary lat/lng for different images
        "droneLng": -72.33 + (image_id * 0.0001),
        "detections": [
            {"box": {"x": 50, "y": 100, "width": 150, "height": 100}, "weedType": "Broadleaf Weed", "confidence": 0.95, "lat_offset": 0.0001, "lng_offset": -0.0002},
            {"box": {"x": 200, "y": 250, "width": 120, "height": 80}, "weedType": "Grassy Weed", "confidence": 0.88, "lat_offset": 0.0003, "lng_offset": 0.0001},
            {"box": {"x": 450, "y": 50, "width": 90, "height": 70}, "weedType": "Nut Sedge", "confidence": 0.92, "lat_offset": -0.0001, "lng_offset": 0.0003},
            {"box": {"x": 600, "y": 400, "width": 100, "height": 60}, "weedType": "Broadleaf Weed", "confidence": 0.80, "lat_offset": 0.0002, "lng_offset": -0.0001},
            {"box": {"x": 100, "y": 450, "width": 70, "height": 50}, "weedType": "Grassy Weed", "confidence": 0.75, "lat_offset": -0.0002, "lng_offset": 0.0002},
            {"box": {"x": 350, "y": 180, "width": 110, "height": 90}, "weedType": "Unknown Weed", "confidence": 0.60, "lat_offset": 0.0004, "lng_offset": 0.0004},
            {"box": {"x": 280, "y": 50, "width": 80, "height": 60}, "weedType": "Broadleaf Weed", "confidence": 0.90, "lat_offset": -0.0003, "lng_offset": -0.0003},
            {"box": {"x": 550, "y": 200, "width": 130, "height": 85}, "weedType": "Grassy Weed", "confidence": 0.85, "lat_offset": 0.0001, "lng_offset": 0.0005},
        ]
    }

# Generate data for a few mock images/flights
MOCK_IMAGES_DATA = {
    "img_001": generate_mock_image_data(1),
    "img_002": generate_mock_image_data(2),
    # You can add more mock images here if you want to cycle through them
}

# Consolidate all weed locations from all mock images for the map
ALL_WEED_LOCATIONS = []
for img_id, img_data in MOCK_IMAGES_DATA.items():
    drone_lat = img_data['droneLat']
    drone_lng = img_data['droneLng']
    for det in img_data['detections']:
        # Simulate slight offset from drone's center for individual weed locations
        weed_lat = drone_lat + det['lat_offset']
        weed_lng = drone_lng + det['lng_offset']
        ALL_WEED_LOCATIONS.append({
            "lat": weed_lat,
            "lng": weed_lng,
            "weedType": det['weedType'],
            "confidence": det['confidence']
        })

# --- API Endpoints ---

@app.route('/api/latest_image', methods=['GET'])
def get_latest_image_data():
    """Returns data for the most 'recent' mock image."""
    # In a real app, you'd fetch the actual latest from your DB
    latest_image_id = sorted(MOCK_IMAGES_DATA.keys())[-1] # Get latest by ID
    return jsonify(MOCK_IMAGES_DATA[latest_image_id])

@app.route('/api/weed_locations', methods=['GET'])
def get_weed_locations_for_map():
    """Returns all aggregated weed locations for the map heatmap."""
    return jsonify(ALL_WEED_LOCATIONS)

@app.route('/api/classified_weeds_summary', methods=['GET'])
def get_classified_weeds_summary():
    """Returns a summary of classified weed counts."""
    summary = {}
    for loc in ALL_WEED_LOCATIONS:
        weed_type = loc['weedType'] or 'Unknown Weed'
        summary[weed_type] = summary.get(weed_type, 0) + 1

    # Convert to list of objects for frontend
    classified_list = [{"weedType": k, "count": v} for k, v in summary.items()]
    return jsonify(classified_list)


if __name__ == '__main__':
    print("Starting Flask backend server...")
    print("Access latest image data at: http://localhost:5000/api/latest_image")
    print("Access all weed locations at: http://localhost:5000/api/weed_locations")
    print("Access classified weed summary at: http://localhost:5000/api/classified_weeds_summary")
    app.run(debug=True) # debug=True allows for auto-reloading on code changes