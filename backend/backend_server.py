from flask import Flask, jsonify, request
from flask_cors import CORS
import datetime
import random
import base64
import re # Import regex for base64 parsing
import os
from dotenv import load_dotenv

load_dotenv()

OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')

if OPENWEATHER_API_KEY is None:
    print("Warning: OPENWEATHER_API_KEY not found in backend/.env or environment variables!")

app = Flask(__name__)
CORS(app) # This enables CORS for all routes

# Base URL for mock images (you can replace these with actual image URLs if you host them)
MOCK_IMAGE_BASE_URL = "https://via.placeholder.com/800x600?text=Drone+Image+"

# Define your new list of weed types
NEW_WEED_TYPES = [
    "Common purslane",
    "Goosegrass",
    "Asthma-plant",
    "Blue porterweed",
    "Santa Maria feverfew",
    "Water hyacinth",
    "Climbing dayflower",
    "Common plantain",
    "Arrowleaf sida",
    "Oriental false hawksbeard"
]

def generate_mock_image_data(image_id):
    """Generates mock data for a single image capture with detections."""
    current_time = datetime.datetime.now(datetime.timezone.utc)
    
    # Simulate a drone's approximate location in Haiti (Port-au-Prince area)
    # Adding slight variations based on image_id
    drone_lat = 18.59 + (image_id * 0.0001) % 0.01  # Small variation
    drone_lng = -72.33 + (image_id * 0.0001) % 0.01 # Small variation

    # Generate a random number of detections (e.g., 5 to 10)
    num_detections = random.randint(5, 10)
    
    detections = []
    for _ in range(num_detections):
        # Randomly select a weed type from the new list
        weed_type = random.choice(NEW_WEED_TYPES + ["Unknown Weed"]) # Keep Unknown Weed as an option
        
        # Generate random box coordinates (simulating a 800x600 image)
        x = random.randint(30, 700)
        y = random.randint(30, 500)
        width = random.randint(50, 150)
        height = random.randint(40, 120)
        confidence = round(random.uniform(0.6, 0.99), 2)
        
        # Simulate slight geographical offsets for map visualization
        # These offsets are relative to the drone's position for that image
        lat_offset = round(random.uniform(-0.0005, 0.0005), 5)
        lng_offset = round(random.uniform(-0.0005, 0.0005), 5)

        detections.append({
            "box": {"x": x, "y": y, "width": width, "height": height},
            "weedType": weed_type,
            "confidence": confidence,
            "lat_offset": lat_offset, # Offset from drone's lat
            "lng_offset": lng_offset  # Offset from drone's lng
        })
    
    return {
        "id": f"img_{image_id}",
        "imageUrl": f"{MOCK_IMAGE_BASE_URL}{image_id}",
        "timestamp": current_time.isoformat(),
        "droneLat": drone_lat,
        "droneLng": drone_lng,
        "detections": detections
    }

# Mock data for uploaded images - using specific weed types (CORRECTED SYNTAX)
MOCK_UPLOAD_DETECTIONS = [
    {"box": {"x": 80, "y": 150, "width": 180, "height": 120}, "weedType": "Common purslane", "confidence": 0.93, "lat_offset": 0.0001, "lng_offset": -0.0002},
    {"box": {"x": 300, "y": 200, "width": 150, "height": 100}, "weedType": "Goosegrass", "confidence": 0.85, "lat_offset": 0.0003, "lng_offset": 0.0001},
    {"box": {"x": 500, "y": 80, "width": 100, "height": 80}, "weedType": "Asthma-plant", "confidence": 0.90, "lat_offset": -0.0001, "lng_offset": 0.0003},
    {"box": {"x": 120, "y": 380, "width": 90, "height": 70}, "weedType": "Blue porterweed", "confidence": 0.82, "lat_offset": 0.0002, "lng_offset": -0.0001},
    {"box": {"x": 650, "y": 300, "width": 110, "height": 90}, "weedType": "Santa Maria feverfew", "confidence": 0.70, "lat_offset": 0.0004, "lng_offset": 0.0004},
    {"box": {"x": 200, "y": 100, "width": 90, "height": 70}, "weedType": "Water hyacinth", "confidence": 0.91, "lat_offset": -0.0001, "lng_offset": 0.0001},
    {"box": {"x": 400, "y": 350, "width": 100, "height": 80}, "weedType": "Climbing dayflower", "confidence": 0.88, "lat_offset": 0.0002, "lng_offset": -0.0002},
    {"box": {"x": 50, "y": 250, "width": 120, "height": 90}, "weedType": "Common plantain", "confidence": 0.80, "lat_offset": 0.0003, "lng_offset": 0.0003},
    {"box": {"x": 550, "y": 450, "width": 110, "height": 80}, "weedType": "Arrowleaf sida", "confidence": 0.75, "lat_offset": 0.0001, "lng_offset": 0.0004},
    {"box": {"x": 350, "y": 50, "width": 130, "height": 100}, "weedType": "Oriental false hawksbeard", "confidence": 0.89, "lat_offset": -0.0002, "lng_offset": -0.0001},
]


# In a real application, you would store this in a database
# For mock data, we'll keep a simple list of generated images
mock_drone_images = [generate_mock_image_data(i) for i in range(1, 6)] # Generate 5 mock images

@app.route('/api/latest_image', methods=['GET'])
def latest_image():
    """Returns the most recent mock drone image data."""
    # In a real scenario, this would query a database for the latest image
    if mock_drone_images:
        return jsonify(mock_drone_images[-1]) # Return the last generated image
    return jsonify({"message": "No images available"}), 404

@app.route('/api/weed_locations', methods=['GET'])
def weed_locations():
    """Returns a simplified list of all detected weed locations for the map."""
    all_weed_locations = []
    # Collect locations from all mock drone images
    for img_data in mock_drone_images:
        drone_lat = img_data['droneLat']
        drone_lng = img_data['droneLng']
        for detection in img_data['detections']:
            # Calculate absolute lat/lng for each detection based on drone's position + offset
            all_weed_locations.append({
                "lat": drone_lat + detection['lat_offset'],
                "lng": drone_lng + detection['lng_offset'],
                "weedType": detection.get('weedType', 'Unknown'),
                "confidence": detection.get('confidence', 0)
            })
    return jsonify(all_weed_locations)

@app.route('/api/classified_weeds_summary', methods=['GET'])
def classified_weeds_summary():
    """Returns a summary of classified weeds by type and count."""
    weed_counts = {}
    
    # Aggregate from all mock drone images
    for img_data in mock_drone_images:
        for detection in img_data['detections']:
            weed_type = detection.get('weedType', 'Unknown Weed')
            weed_counts[weed_type] = weed_counts.get(weed_type, 0) + 1
    
    # Convert to a list of objects for easier consumption by frontend
    summary = [{"weedType": wt, "count": count} for wt, count in weed_counts.items()]
    return jsonify(summary)

@app.route('/api/upload_image', methods=['POST'])
def upload_image():
    """
    Receives an uploaded image (base64) and returns mock detection results for it.
    """
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({"error": "No image data provided"}), 400

    image_data_b64 = data['image']

    # Basic validation and stripping of data URL prefix
    if not image_data_b64.startswith('data:image'):
        return jsonify({"error": "Invalid image data format"}), 400

    # Simulate processing by returning mock detections
    # For a real app, you'd send this to a ML model for inference
    
    # For demonstration, we'll use a fixed drone location for the uploaded image
    # You might want to get this from EXIF data in a real app or let the user input.
    mock_drone_lat = 18.595 # Slightly different location for uploaded image
    mock_drone_lng = -72.335
    
    # We use MOCK_UPLOAD_DETECTIONS for a consistent result for uploaded images
    # If you want it random, you can call generate_mock_image_data and use its detections
    
    # Example: If you wanted a *new* random set for each upload:
    # new_mock_data = generate_mock_image_data(random.randint(100, 200)) # Use new ID range
    # response_detections = new_mock_data['detections']
    # response_drone_lat = new_mock_data['droneLat']
    # response_drone_lng = new_mock_data['droneLng']

    # Using the predefined MOCK_UPLOAD_DETECTIONS for consistency:
    response_detections = MOCK_UPLOAD_DETECTIONS
    response_drone_lat = mock_drone_lat
    response_drone_lng = mock_drone_lng

    # In a real app, you might save the image and its detections to a database here
    # For this mock, we just return the "processed" data
    
    # Add the detections from the uploaded image to the overall mock_drone_images list
    # so they appear on the map and in the classified weeds summary.
    # Note: In a real app, you'd save the image URL and process it more robustly.
    mock_drone_images.append({
        "id": f"uploaded_img_{len(mock_drone_images) + 1}",
        "imageUrl": image_data_b64, # Use the base64 data URL itself for display
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "droneLat": response_drone_lat,
        "droneLng": response_drone_lng,
        "detections": response_detections
    })

    return jsonify({
        "message": "Image received and processed (mock).",
        "detections": response_detections,
        "droneLat": response_drone_lat, # Return the mock drone location for the uploaded image
        "droneLng": response_drone_lng
    }), 200

if __name__ == '__main__':
    # Ensure all required packages are installed before running
    # You can add a check here, or rely on `pip install -r requirements.txt`
    print("Starting Flask backend server...")
    print(f"Running on http://127.0.0.1:5000")
    print("Press CTRL+C to quit")
    app.run(debug=True, port=5000) # debug=True enables auto-reloading and better error messages