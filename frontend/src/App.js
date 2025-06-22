import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Import the new LanguageInstructions component
import LanguageInstructions from './languageInstructions';

// Fix for default marker icon in Leaflet (essential for any Leaflet map using default markers)
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- Hardcoded English Strings (for primary display) ---
// For a larger app, these would typically still be in a translations file
// but simplified to only English keys if not using a translation library.
const englishStrings = {
    // App Title & Slogan
    app_title: "Haiti Agri-Tech Dashboard",
    app_slogan: "Weed Detection & Management for Farmers",

    // Upload Section
    upload_section_header: "Upload Your Own Image for Analysis",
    choose_image_button: "Choose Image to Upload",
    uploading_button: "Uploading...",
    upload_error: "Please upload an image file (e.g., JPEG, PNG).",
    upload_failed: "Failed to upload image for processing. Please try again.",
    upload_success: "Image uploaded successfully! See analysis below.",
    processing_image: "Processing uploaded image...",
    error_loading_dashboard: (backendUrl) => `Failed to load dashboard data. Is the backend running at ${backendUrl}?`,

    // Image & Map Section
    current_image_header: "Current Image & Weed Detections",
    map_info_latest: (imageSource) => `Displaying data for the ${imageSource} image.`,
    latest_drone_image: "latest drone",
    uploaded_image: "uploaded",
    loading_image_data: "Loading initial image data...",
    weed_map_header: "Weed Distribution Map",
    map_info_dots: "Red dots indicate individual weed locations.",

    // Weed Treatment Plan Section
    weed_treatment_plan_header: "Weed Treatment Plan",
    no_weeds_detected: "No weeds detected yet, or data not loaded.",
    select_weed_type_label: "Select Weed Type:",
    recommendation_title: "Recommended Methods:",
    notes_prefix: "Notes:",
    control_label: "Control",

    // Weather Forecast Section
    weather_forecast_header: (location) => `Weather Forecast for ${location}`,
    loading_weather: "Loading weather...",
    no_weather_data: "No weather data available.",
    current_conditions_header: "Current Conditions",
    temperature_label: "Temperature:",
    humidity_label: "Humidity:",
    wind_label: "Wind:",
    rain_label: "Rain (1h):",
    farming_tip_prefix: "Farming Tip:",
    rain_expected_tip: "Rain expected: Avoid spraying today.",
    hot_tip: "Very hot: Consider early morning/late evening activities.",
    cold_tip: "Cold: Check crop tolerance.",
    favorable_tip: "Favorable conditions for field work.",
    five_day_forecast_header: "5-Day Forecast",
    rain_probability_label: "Rain Prob:",
    open_weather_api_key_error: "Please replace 'YOUR_OPENWEATHERMAP_API_KEY' with your actual OpenWeatherMap API key.",
    failed_to_fetch_weather_data: "Failed to fetch weather data. Please check your API key and internet connection.",

    // Footer
    footer_text: "© 2025 Haiti Hackathon Team. Empowering Farmers with Technology.",

    // Other specific labels
    confidence_label: "Confidence:",
    weed_label_title: "Weed",

    // Weed Type Translations (English only for main UI)
    "weed_types": {
        "Common purslane": "Common purslane",
        "Goosegrass": "Goosegrass",
        "Asthma-plant": "Asthma-plant",
        "Blue porterweed": "Blue porterweed",
        "Santa Maria feverfew": "Santa Maria feverfew",
        "Water hyacinth": "Water hyacinth",
        "Climbing dayflower": "Climbing dayflower",
        "Common plantain": "Common plantain",
        "Arrowleaf sida": "Arrowleaf sida",
        "Oriental false hawksbeard": "Oriental false hawksbeard",
        "Unknown Weed": "Unknown Weed",
    },
    // Treatment Method Translations (English only for main UI)
    "treatment_methods": {
        "Manual removal": "Manual removal",
        "Mulching": "Mulching",
        "Cultivation": "Cultivation",
        "Pre-emergent herbicides": "Pre-emergent herbicides",
        "Post-emergent herbicides": "Post-emergent herbicides",
        "Improve turf density": "Improve turf density",
        "Containment": "Containment",
        "Herbicides": "Herbicides",
        "Early detection": "Early detection",
        "Biological control": "Biological control",
        "Repeated mowing/trimming": "Repeated mowing/trimming",
        "Improve soil health": "Improve soil health",
        "Consult an expert": "Consult an expert",
        "Mowing": "Mowing"
    },
    // Treatment Notes Translations (English only for main UI)
    "treatment_notes": {
        "Common purslane": "Produces many seeds quickly; remove before flowering. Can re-root from stem fragments.",
        "Goosegrass": "Thrives in compacted soil; aeration can help. Spreads by seed and tillers.",
        "Asthma-plant": "Prolific seed producer; control before it sets seed. Sap can be an irritant.",
        "Blue porterweed": "Fast-growing and can outcompete native species. Monitor closely.",
        "Santa Maria feverfew": "Highly toxic to livestock and can cause allergies in humans. Prioritize eradication.",
        "Water hyacinth": "Forms dense mats, depleting oxygen and blocking waterways. Requires persistent management.",
        "Climbing dayflower": "Can quickly cover and smother desirable plants. Watch for new shoots.",
        "Common plantain": "Tolerant of compacted soils and high traffic. Good lawn health is a preventative measure.",
        "Arrowleaf sida": "Resilient perennial; requires persistent effort for complete removal. Prevents re-establishment.",
        "Oriental false hawksbeard": "Prolific seed producer; prioritize control to limit spread in disturbed areas.",
        "Unknown Weed": "Further identification is highly recommended for effective long-term management."
    }
};

// Helper function to get the English string, handling interpolation
const getEnglishString = (key, ...args) => {
    let str = englishStrings[key];
    if (typeof str === 'function') {
        return str(...args);
    }
    return str || key; // Fallback to key if not found
};


// --- Component 1: ImageDisplay ---
const ImageDisplay = ({ imageUrl, detections }) => {
    const imgRef = useRef(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const img = imgRef.current;
        if (img) {
            const loadImage = () => {
                setImageDimensions({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });
            };
            if (img.complete) {
                loadImage();
            } else {
                img.onload = loadImage;
            }
        }
    }, [imageUrl]);

    const scaleBox = (box) => {
        if (!imageDimensions.width || !imageDimensions.height) return {};
        const scaleX = imgRef.current.clientWidth / imageDimensions.width;
        const scaleY = imgRef.current.clientHeight / imageDimensions.height;
        return {
            left: box.x * scaleX,
            top: box.y * scaleY,
            width: box.width * scaleX,
            height: box.height * scaleY,
        };
    };

    return (
        <div style={imageDisplayStyles.container}>
            <img
                ref={imgRef}
                src={imageUrl}
                alt="Drone capture"
                style={imageDisplayStyles.image}
            />
            {imageDimensions.width > 0 && detections.map((detection, index) => (
                <div
                    key={index}
                    style={{
                        ...imageDisplayStyles.boundingBox,
                        borderColor: imageDisplayStyles.weedTypeColors[detection.weedType] || 'red',
                        ...scaleBox(detection.box),
                    }}
                    // Title attribute displays English only
                    title={`${englishStrings.weed_label_title}: ${englishStrings.weed_types[detection.weedType] || englishStrings.weed_types["Unknown Weed"]} (${englishStrings.confidence_label}: ${(detection.confidence * 100).toFixed(2)}%)`}
                >
                    {detection.weedType && (
                        <span style={imageDisplayStyles.weedLabel}>
                            {englishStrings.weed_types[detection.weedType] || englishStrings.weed_types["Unknown Weed"]}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

const imageDisplayStyles = {
    container: {
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        margin: '20px auto',
        border: '1px solid #ccc',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f0f0f0',
    },
    image: {
        width: '100%',
        height: 'auto',
        display: 'block',
    },
    boundingBox: {
        position: 'absolute',
        borderWidth: '2px',
        borderStyle: 'solid',
        boxSizing: 'border-box',
        opacity: 0.8,
    },
    weedTypeColors: {
        'Common purslane': 'darkred',
        'Goosegrass': 'darkgreen',
        'Asthma-plant': 'darkblue',
        'Blue porterweed': 'purple',
        'Santa Maria feverfew': 'orange',
        'Water hyacinth': 'teal',
        'Climbing dayflower': 'brown',
        'Common plantain': 'olive',
        'Arrowleaf sida': 'indigo',
        'Oriental false hawksbeard': 'darkcyan',
        'Unknown Weed': 'gray'
    },
    weedLabel: {
        position: 'absolute',
        bottom: '-20px',
        left: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        padding: '2px 5px',
        fontSize: '0.7em',
        whiteSpace: 'nowrap',
    }
};

// --- Component 2: WeedMap ---
const WeedMap = ({ weedLocations }) => {
    const HAITI_CENTER = [18.9712, -72.2852]; // Central Haiti

    return (
        <MapContainer center={HAITI_CENTER} zoom={13} style={weedMapStyles.mapContainer}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            {weedLocations && weedLocations.map((loc, index) => (
                <CircleMarker
                    key={index}
                    center={[loc.lat, loc.lng]}
                    radius={6}
                    color="red"
                    fillColor="red"
                    fillOpacity={0.8}
                />
            ))}
        </MapContainer>
    );
};

const weedMapStyles = {
    mapContainer: {
        height: '500px',
        width: '100%'
    }
};

// --- Component 3: TreatmentPlan ---
const TreatmentPlan = ({ classifiedWeeds }) => {
    const [selectedWeedType, setSelectedWeedType] = useState('');

    const treatmentRecommendations = {
        "Common purslane": {
            title_key: "Common purslane",
            methods_keys: [
                "Manual removal",
                "Mulching",
                "Cultivation",
            ],
            notes_key: "Common purslane"
        },
        "Goosegrass": {
            title_key: "Goosegrass",
            methods_keys: [
                "Pre-emergent herbicides",
                "Post-emergent herbicides",
                "Manual removal",
            ],
            notes_key: "Goosegrass"
        },
        "Asthma-plant": {
            title_key: "Asthma-plant",
            methods_keys: [
                "Manual removal",
                "Herbicides",
                "Improve turf density",
            ],
            notes_key: "Asthma-plant"
        },
        "Blue porterweed": {
            title_key: "Blue porterweed",
            methods_keys: [
                "Manual removal",
                "Containment",
                "Herbicides",
            ],
            notes_key: "Blue porterweed"
        },
        "Santa Maria feverfew": {
            title_key: "Santa Maria feverfew",
            methods_keys: [
                "Manual removal",
                "Early detection",
                "Biological control",
            ],
            notes_key: "Santa Maria feverfew"
        },
        "Water hyacinth": {
            title_key: "Water hyacinth",
            methods_keys: [
                "Manual removal",
                "Biological control",
                "Herbicides",
            ],
            notes_key: "Water hyacinth"
        },
        "Climbing dayflower": {
            title_key: "Climbing dayflower",
            methods_keys: [
                "Manual removal",
                "Repeated mowing/trimming",
                "Herbicides",
            ],
            notes_key: "Climbing dayflower"
        },
        "Common plantain": {
            title_key: "Common plantain",
            methods_keys: [
                "Manual removal",
                "Improve soil health",
                "Herbicides",
            ],
            notes_key: "Common plantain"
        },
        "Arrowleaf sida": {
            title_key: "Arrowleaf sida",
            methods_keys: [
                "Manual removal",
                "Mowing",
                "Herbicides",
            ],
            notes_key: "Arrowleaf sida"
        },
        "Oriental false hawksbeard": {
            title_key: "Oriental false hawksbeard",
            methods_keys: [
                "Manual removal",
                "Mowing",
                "Herbicides",
            ],
            notes_key: "Oriental false hawksbeard"
        },
        "Unknown Weed": {
            title_key: "Unknown Weed",
            methods_keys: [
                "Manual removal",
                "Improve soil health",
                "Consult an expert",
            ],
            notes_key: "Unknown Weed"
        }
    };


    useEffect(() => {
        if (classifiedWeeds && classifiedWeeds.length > 0 && !selectedWeedType) {
            setSelectedWeedType(classifiedWeeds[0].weedType || 'Unknown Weed');
        }
    }, [classifiedWeeds, selectedWeedType]);

    const displayWeedTypes = classifiedWeeds.reduce((acc, weed) => {
        const type = weed.weedType || 'Unknown Weed';
        if (!acc.includes(type)) {
            acc.push(type);
        }
        return acc;
    }, []);

    const recommendation = treatmentRecommendations[selectedWeedType] || treatmentRecommendations["Unknown Weed"];

    return (
        <div style={treatmentPlanStyles.container}>
            <h2>{getEnglishString('weed_treatment_plan_header')}</h2>
            {classifiedWeeds.length === 0 ? (
                <p>{getEnglishString('no_weeds_detected')}</p>
            ) : (
                <>
                    <div style={treatmentPlanStyles.weedTypeSelector}>
                        <label htmlFor="weed-type-select">
                            {getEnglishString('select_weed_type_label')}
                        </label>
                        <select
                            id="weed-type-select"
                            value={selectedWeedType}
                            onChange={(e) => setSelectedWeedType(e.target.value)}
                            style={treatmentPlanStyles.select}
                        >
                            {displayWeedTypes.map((type, index) => (
                                <option key={index} value={type}>
                                    {englishStrings.weed_types[type]}
                                </option>
                            ))}
                        </select>
                    </div>
                    {recommendation && (
                        <div style={treatmentPlanStyles.recommendationDetails}>
                            <h3>
                                {englishStrings.weed_types[recommendation.title_key]} {getEnglishString('control_label')}
                            </h3>
                            <h4>{getEnglishString('recommendation_title')}</h4>
                            <ul style={treatmentPlanStyles.ul}>
                                {recommendation.methods_keys.map((method_key, index) => (
                                    <li key={index} style={treatmentPlanStyles.li}>
                                        {englishStrings.treatment_methods[method_key]}
                                    </li>
                                ))}
                            </ul>
                            <p style={treatmentPlanStyles.notes}>
                                **{getEnglishString('notes_prefix')}** {englishStrings.treatment_notes[recommendation.notes_key]}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const treatmentPlanStyles = {
    container: {
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    h2: { color: '#333', marginBottom: '15px' },
    weedTypeSelector: { marginBottom: '15px' },
    label: { marginRight: '10px', fontWeight: 'bold' },
    select: {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '1em',
        minWidth: '150px',
    },
    recommendationDetails: {
        marginTop: '20px',
        backgroundColor: '#e6f7ff',
        borderLeft: '5px solid #007bff',
        padding: '15px',
        borderRadius: '4px',
    },
    h3: { color: '#0056b3', marginBottom: '10px' },
    h4: { color: '#007bff', marginTop: '15px', marginBottom: '5px' },
    ul: { listStyleType: 'disc', marginLeft: '20px', paddingLeft: '0' },
    li: { marginBottom: '8px', lineHeight: '1.4' },
    notes: {
        fontStyle: 'italic',
        color: '#666',
        marginTop: '15px',
        borderTop: '1px dashed #cceeff',
        paddingTop: '10px',
    }
};

// --- Component 4: WeatherForecast ---
const WeatherForecast = ({ latitude = 18.59, longitude = -72.33 }) => { // Default to Port-au-Prince
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_KEY = 'eb5d6ac67ad139256ed22dc56b98b902';

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            setError(null);
            if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY' || !API_KEY) {
                setError(getEnglishString("open_weather_api_key_error"));
                setLoading(false);
                return;
            }
            try {
                const currentResponse = await axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                );
                const forecastResponse = await axios.get(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                );

                setWeatherData({
                    current: currentResponse.data,
                    forecast: forecastResponse.data.list.filter((_, index) => index % 8 === 0)
                });
            } catch (err) {
                console.error("Error fetching weather data:", err);
                setError(getEnglishString("failed_to_fetch_weather_data"));
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
        const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [latitude, longitude, API_KEY]);

    const getWeatherIconUrl = (iconCode) => `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

    const getFarmingRecommendation = (temp, rain) => {
        if (rain > 0.5) return getEnglishString("rain_expected_tip");
        if (temp > 30) return getEnglishString("hot_tip");
        if (temp < 10) return getEnglishString("cold_tip");
        return getEnglishString("favorable_tip");
    };

    if (loading) { return <div style={weatherStyles.container}>{getEnglishString('loading_weather')}</div>; }
    if (error) { return <div style={{...weatherStyles.container, ...weatherStyles.error}}>{error}</div>; }
    if (!weatherData) { return <div style={weatherStyles.container}>{getEnglishString('no_weather_data')}</div>; }

    const { current, forecast } = weatherData;

    return (
        <div style={weatherStyles.container}>
            <h2>{getEnglishString('weather_forecast_header', current.name)}</h2>
            <div style={weatherStyles.currentWeather}>
                <h3>{getEnglishString('current_conditions_header')}</h3>
                <div style={weatherStyles.weatherDetails}>
                    <img src={getWeatherIconUrl(current.weather[0].icon)} alt={current.weather[0].description} style={weatherStyles.icon}/>
                    <p style={weatherStyles.p}>{current.weather[0].description}</p>
                    <p style={weatherStyles.p}>{getEnglishString('temperature_label')} {current.main.temp}°C</p>
                    <p style={weatherStyles.p}>{getEnglishString('humidity_label')} {current.main.humidity}%</p>
                    <p style={weatherStyles.p}>{getEnglishString('wind_label')} {current.wind.speed} m/s</p>
                    {current.rain && current.rain['1h'] && <p style={weatherStyles.p}>{getEnglishString('rain_label')} {current.rain['1h']} mm</p>}
                </div>
                <p style={weatherStyles.farmingRecommendation}>
                    **{getEnglishString('farming_tip_prefix')}** {getFarmingRecommendation(current.main.temp, current.rain ? current.rain['1h'] || 0 : 0)}
                </p>
            </div>
            <div style={weatherStyles.fiveDayForecast}>
                <h3>{getEnglishString('five_day_forecast_header')}</h3>
                <div style={weatherStyles.forecastList}>
                    {forecast.map((day, index) => (
                        <div key={index} style={weatherStyles.forecastDay}>
                            <p style={weatherStyles.date}>{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            <img src={getWeatherIconUrl(day.weather[0].icon)} alt={day.weather[0].description} style={weatherStyles.iconSmall}/>
                            <p style={weatherStyles.pSmall}>{day.weather[0].description}</p>
                            <p style={weatherStyles.pSmall}>{getEnglishString('temperature_label')} {day.main.temp}°C</p>
                            {day.pop && <p style={weatherStyles.pSmall}>{getEnglishString('rain_probability_label')} {(day.pop * 100).toFixed(0)}%</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const weatherStyles = {
    container: {
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    error: { color: 'red', fontWeight: 'bold' },
    h2: { color: '#333', marginBottom: '20px' },
    h3: { color: '#555', marginBottom: '15px' },
    currentWeather: { marginBottom: '20px' },
    weatherDetails: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap',
    },
    icon: { width: '60px', height: '60px' },
    p: { margin: '0', fontSize: '1.1em', color: '#444' },
    farmingRecommendation: {
        fontWeight: 'bold',
        color: '#007bff',
        backgroundColor: '#e6f7ff',
        padding: '10px',
        borderRadius: '5px',
        marginTop: '15px',
    },
    fiveDayForecast: {},
    forecastList: {
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '15px',
    },
    forecastDay: {
        flex: '1',
        minWidth: '120px',
        maxWidth: '180px',
        textAlign: 'center',
        border: '1px solid #eee',
        padding: '10px',
        borderRadius: '5px',
        backgroundColor: '#f9f9f9',
    },
    date: { fontWeight: 'bold', color: '#666', marginBottom: '5px' },
    iconSmall: { width: '50px', height: '50px' },
    pSmall: { margin: '5px 0', fontSize: '0.9em', color: '#555' }
};


// --- Main App Component (Dashboard) ---
function App() {
    const [currentImage, setCurrentImage] = useState(null);
    const [weedLocations, setWeedLocations] = useState([]);
    const [classifiedWeeds, setClassifiedWeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    // New state to control the visibility of the instruction modal
    const [showInstructions, setShowInstructions] = useState(false);

    const BACKEND_URL = 'http://localhost:5000/api'; // Make sure this matches your Flask server URL

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!uploadedImagePreview && !uploading) {
                    const imageResponse = await axios.get(`${BACKEND_URL}/latest_image`);
                    setCurrentImage({
                        url: imageResponse.data.imageUrl,
                        detections: imageResponse.data.detections.map(det => ({
                            ...det,
                            lat: imageResponse.data.droneLat + det.lat_offset,
                            lng: imageResponse.data.droneLng + det.lng_offset,
                        }))
                    });
                }

                const locationsResponse = await axios.get(`${BACKEND_URL}/weed_locations`);
                setWeedLocations(locationsResponse.data);

                const classifiedWeedsResponse = await axios.get(`${BACKEND_URL}/classified_weeds_summary`);
                setClassifiedWeeds(classifiedWeedsResponse.data);

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError(getEnglishString('error_loading_dashboard', BACKEND_URL));
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        const intervalId = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes
        return () => clearInterval(intervalId);
    }, [BACKEND_URL, uploadedImagePreview, uploading]);


    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setUploadError(getEnglishString("upload_error"));
            return;
        }

        setUploading(true);
        setUploadError(null);
        setUploadedImagePreview(null);
        setCurrentImage(null);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const imageDataUrl = reader.result;

            setUploadedImagePreview(imageDataUrl);

            try {
                const response = await axios.post(`${BACKEND_URL}/upload_image`, {
                    image: imageDataUrl
                });

                const { detections, droneLat, droneLng } = response.data;

                setCurrentImage({
                    url: imageDataUrl,
                    detections: detections.map(det => ({
                        ...det,
                        lat: droneLat + det.lat_offset,
                        lng: droneLng + det.lng_offset,
                    }))
                });

                setWeedLocations(prevLocations => [
                    ...prevLocations,
                    ...detections.map(det => ({
                        lat: droneLat + det.lat_offset,
                        lng: droneLng + det.lng_offset,
                        weedType: det.weedType,
                        confidence: det.confidence
                    }))
                ]);

            } catch (err) {
                console.error("Error uploading image:", err);
                setUploadError(getEnglishString("upload_failed"));
                setCurrentImage({
                    url: "https://via.placeholder.com/800x600/FF0000/FFFFFF?text=Error+Loading+Image",
                    detections: []
                });
            } finally {
                setUploading(false);
            }
        };

        reader.readAsDataURL(file);
    };

    return (
        <div style={appStyles.dashboard}>
            <style>{`
                body {
                    margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                        sans-serif;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    background-color: #f4f7f6;
                    color: #333;
                }
            `}</style>
            <header style={appStyles.dashboardHeader}>
                <h1>{getEnglishString('app_title')}</h1>
                <p>{getEnglishString('app_slogan')}</p>
                {/* Button to open instructions */}
                <button onClick={() => setShowInstructions(true)} style={appStyles.instructionButton}>
                    View Instructions in Kreyòl
                </button>
            </header>

            <main style={appStyles.dashboardContent}>
                <section style={{...appStyles.dashboardSection, ...appStyles.imageSection}}>
                    <h2>{getEnglishString('upload_section_header')}</h2>
                    <div style={uploadStyles.container}>
                        <label htmlFor="image-upload" style={uploadStyles.button}>
                            {uploading ? getEnglishString('uploading_button') : getEnglishString('choose_image_button')}
                        </label>
                        <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={uploadStyles.input}
                            disabled={uploading}
                        />
                        {uploadError && <p style={uploadStyles.error}>{uploadError}</p>}
                        {uploadedImagePreview && (
                            <p style={uploadStyles.success}>{getEnglishString('upload_success')}</p>
                        )}
                    </div>

                    {uploading ? (
                        <p style={appStyles.dashboardLoading}>{getEnglishString('processing_image')}</p>
                    ) : error ? (
                        <div style={appStyles.dashboardError}>{error}</div>
                    ) : currentImage ? (
                        <>
                            <h2>{getEnglishString('current_image_header')}</h2>
                            <ImageDisplay
                                imageUrl={currentImage.url}
                                detections={currentImage.detections}
                            />
                            <p style={appStyles.mapInfo}>
                                {getEnglishString('map_info_latest', uploadedImagePreview ? getEnglishString('uploaded_image') : getEnglishString('latest_drone_image'))}
                            </p>
                        </>
                    ) : (
                        <p style={appStyles.dashboardLoading}>{getEnglishString('loading_image_data')}</p>
                    )}
                </section>

                <section style={{...appStyles.dashboardSection, ...appStyles.mapSection}}>
                    <h2>{getEnglishString('weed_map_header')}</h2>
                    <WeedMap weedLocations={weedLocations} />
                    <p style={appStyles.mapInfo}>{getEnglishString('map_info_dots')}</p>
                </section>

                <div style={appStyles.flexContainer}>
                    <section style={{...appStyles.dashboardSection, ...appStyles.treatmentSection, ...appStyles.flexItem}}>
                        <TreatmentPlan classifiedWeeds={classifiedWeeds} />
                    </section>

                    <section style={{...appStyles.dashboardSection, ...appStyles.weatherSection, ...appStyles.flexItem}}>
                        <WeatherForecast />
                    </section>
                </div>
            </main>

            <footer style={appStyles.dashboardFooter}>
                <p>{getEnglishString('footer_text')}</p>
            </footer>

            {/* Render the LanguageInstructions modal if showInstructions is true */}
            {showInstructions && <LanguageInstructions onClose={() => setShowInstructions(false)} />}
        </div>
    );
}

const appStyles = {
    dashboard: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
    },
    dashboardHeader: {
        textAlign: 'center',
        marginBottom: '40px',
        backgroundColor: '#007bff',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        position: 'relative', // Needed for absolute positioning of the button
    },
    instructionButton: {
        position: 'absolute',
        top: '15px',
        right: '20px',
        padding: '8px 15px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '0.9em',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
    },
    dashboardContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
    },
    dashboardSection: {
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    mapInfo: {
        textAlign: 'center',
        marginTop: '15px',
        color: '#666',
        fontSize: '0.9em',
    },
    flexContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '30px',
    },
    flexItem: {
        flex: '1',
        minWidth: '300px',
    },
    dashboardFooter: {
        textAlign: 'center',
        marginTop: '40px',
        padding: '20px',
        color: '#777',
        fontSize: '0.9em',
        borderTop: '1px solid #e0e0e0',
    },
    dashboardLoading: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '1.2em',
        color: '#007bff',
    },
    dashboardError: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '1.2em',
        color: 'red',
        backgroundColor: '#ffe0e0',
        borderRadius: '8px',
    },
};

const uploadStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '20px',
        marginTop: '10px',
    },
    input: {
        display: 'none',
    },
    button: {
        backgroundColor: '#28a745',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        border: 'none',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'background-color 0.2s ease',
    },
    error: {
        color: 'red',
        marginTop: '10px',
        fontSize: '0.9em',
    },
    success: {
        color: '#28a745',
        marginTop: '10px',
        fontSize: '0.9em',
    }
};

export default App;