import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat'; // Make sure to import the heat plugin

// Fix for default marker icon in Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// --- Component 1: ImageDisplay (now embedded) ---
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
                        ...scaleBox(detection.box),
                        borderColor: imageDisplayStyles.weedTypeColors[detection.weedType] || 'red'
                    }}
                    title={`Weed: ${detection.weedType || 'Unknown'} (Confidence: ${(detection.confidence * 100).toFixed(2)}%)`}
                >
                    {detection.weedType && (
                        <span style={imageDisplayStyles.weedLabel}>{detection.weedType}</span>
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
    weedTypeColors: { // Define colors for different weed types
        'Broadleaf Weed': 'green',
        'Grassy Weed': 'blue',
        'Nut Sedge': 'purple',
        'Unknown Weed': 'red'
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

// --- Component 2: WeedMap (now embedded) ---
const WeedMap = ({ weedLocations }) => {
    const mapRef = useRef();
    const HAITI_CENTER = [18.9712, -72.2852]; // Central Haiti

    useEffect(() => {
        if (mapRef.current && weedLocations && weedLocations.length > 0) {
            const map = mapRef.current;

            map.eachLayer((layer) => {
                if (layer instanceof L.HeatLayer) {
                    map.removeLayer(layer);
                }
            });

            const heatData = weedLocations.map(loc => [
                loc.lat,
                loc.lng,
                loc.confidence || 1
            ]);

            if (heatData.length > 0) {
                const heatLayer = L.heatLayer(heatData, {
                    radius: 25,
                    blur: 15,
                    maxZoom: 17,
                    gradient: {
                        0.0: 'blue',
                        0.5: 'lime',
                        0.7: 'yellow',
                        1.0: 'red'
                    }
                });
                heatLayer.addTo(map);
            }

            const latLngs = weedLocations.map(loc => [loc.lat, loc.lng]);
            if (latLngs.length > 0) {
                map.fitBounds(latLngs, { padding: [50, 50] });
            }
        }
    }, [weedLocations]);

    return (
        <MapContainer center={HAITI_CENTER} zoom={13} style={weedMapStyles.mapContainer} whenCreated={mapInstance => { mapRef.current = mapInstance }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
        </MapContainer>
    );
};

const weedMapStyles = {
    mapContainer: {
        height: '500px',
        width: '100%'
    }
};

// --- Component 3: TreatmentPlan (now embedded) ---
const treatmentRecommendations = {
    "Broadleaf Weed": {
        title: "Broadleaf Weed Control",
        methods: [
            "Manual removal: Hand-pulling when young and soil is moist.",
            "Mulching: Apply organic mulch to suppress growth.",
            "Targeted herbicide: Use broadleaf-specific herbicides carefully if necessary (consult local agricultural extension for safe options).",
        ],
        notes: "Best time for control is before flowering. Ensure proper disposal to prevent seed spread."
    },
    "Grassy Weed": {
        title: "Grassy Weed Control",
        methods: [
            "Hoeing: Shallow hoeing before weeds are established.",
            "Competitive crops: Plant dense, healthy crops to outcompete grassy weeds.",
            "Pre-emergent herbicide: Consider pre-emergent for large infestations (follow guidelines strictly).",
        ],
        notes: "Prevention is key. Clean equipment to avoid spreading seeds."
    },
    "Nut Sedge": {
        title: "Nut Sedge Control",
        methods: [
            "Repeated cultivation: Disrupt tubers by repeated shallow cultivation.",
            "Smothering: Use opaque tarps or cover crops to shade out sedge.",
            "Specific herbicides: Some herbicides are effective but require precise application and timing.",
        ],
        notes: "Difficult to eradicate due to tubers. Persistence is required."
    },
    "Unknown Weed": {
        title: "Unknown Weed - General Control",
        methods: [
            "Manual removal: Remove carefully to prevent spreading. Identify for better future treatment.",
            "Improve soil health: Healthy soil supports strong crops that can outcompete weeds.",
            "Consult an expert: Share images with a local agronomist for identification and advice.",
        ],
        notes: "Further identification is highly recommended for effective long-term management."
    }
};

const TreatmentPlan = ({ classifiedWeeds }) => {
    const [selectedWeedType, setSelectedWeedType] = useState('');

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
            <h2>Weed Treatment Plan</h2>
            {classifiedWeeds.length === 0 ? (
                <p>No weeds detected yet, or data not loaded.</p>
            ) : (
                <>
                    <div style={treatmentPlanStyles.weedTypeSelector}>
                        <label htmlFor="weed-type-select">Select Weed Type:</label>
                        <select
                            id="weed-type-select"
                            value={selectedWeedType}
                            onChange={(e) => setSelectedWeedType(e.target.value)}
                            style={treatmentPlanStyles.select}
                        >
                            {displayWeedTypes.map((type, index) => (
                                <option key={index} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    {recommendation && (
                        <div style={treatmentPlanStyles.recommendationDetails}>
                            <h3>{recommendation.title}</h3>
                            <h4>Recommended Methods:</h4>
                            <ul style={treatmentPlanStyles.ul}>
                                {recommendation.methods.map((method, index) => (
                                    <li key={index} style={treatmentPlanStyles.li}>{method}</li>
                                ))}
                            </ul>
                            <p style={treatmentPlanStyles.notes}>**Notes:** {recommendation.notes}</p>
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

// --- Component 4: WeatherForecast (now embedded) ---
const WeatherForecast = ({ latitude = 18.59, longitude = -72.33 }) => { // Default to Port-au-Prince
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // <<< GET YOUR API KEY HERE!

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            setError(null);
            if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY' || !API_KEY) {
                setError("Please replace 'YOUR_OPENWEATHERMAP_API_KEY' with your actual OpenWeatherMap API key.");
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
                setError("Failed to fetch weather data. Please check your API key and internet connection.");
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
        if (rain > 0.5) return "Rain expected: Avoid spraying today.";
        if (temp > 30) return "Very hot: Consider early morning/late evening activities.";
        if (temp < 10) return "Cold: Check crop tolerance.";
        return "Favorable conditions for field work.";
    };

    if (loading) { return <div style={weatherStyles.container}>Loading weather...</div>; }
    if (error) { return <div style={{...weatherStyles.container, ...weatherStyles.error}}>{error}</div>; }
    if (!weatherData) { return <div style={weatherStyles.container}>No weather data available.</div>; }

    const { current, forecast } = weatherData;

    return (
        <div style={weatherStyles.container}>
            <h2>Weather Forecast for {current.name}</h2>
            <div style={weatherStyles.currentWeather}>
                <h3>Current Conditions</h3>
                <div style={weatherStyles.weatherDetails}>
                    <img src={getWeatherIconUrl(current.weather[0].icon)} alt={current.weather[0].description} style={weatherStyles.icon}/>
                    <p style={weatherStyles.p}>{current.weather[0].description}</p>
                    <p style={weatherStyles.p}>Temperature: {current.main.temp}°C</p>
                    <p style={weatherStyles.p}>Humidity: {current.main.humidity}%</p>
                    <p style={weatherStyles.p}>Wind: {current.wind.speed} m/s</p>
                    {current.rain && current.rain['1h'] && <p style={weatherStyles.p}>Rain (1h): {current.rain['1h']} mm</p>}
                </div>
                <p style={weatherStyles.farmingRecommendation}>
                    **Farming Tip:** {getFarmingRecommendation(current.main.temp, current.rain ? current.rain['1h'] || 0 : 0)}
                </p>
            </div>
            <div style={weatherStyles.fiveDayForecast}>
                <h3>5-Day Forecast</h3>
                <div style={weatherStyles.forecastList}>
                    {forecast.map((day, index) => (
                        <div key={index} style={weatherStyles.forecastDay}>
                            <p style={weatherStyles.date}>{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            <img src={getWeatherIconUrl(day.weather[0].icon)} alt={day.weather[0].description} style={weatherStyles.iconSmall}/>
                            <p style={weatherStyles.pSmall}>{day.weather[0].description}</p>
                            <p style={weatherStyles.pSmall}>Temp: {day.main.temp}°C</p>
                            {day.pop && <p style={weatherStyles.pSmall}>Rain Prob: {(day.pop * 100).toFixed(0)}%</p>}
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
        marginBottom: '10px',
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

    const BACKEND_URL = 'http://localhost:5000/api'; // Make sure this matches your Flask server URL

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);
            try {
                const imageResponse = await axios.get(`${BACKEND_URL}/latest_image`);
                setCurrentImage({
                    url: imageResponse.data.imageUrl,
                    // Map backend detections to frontend format with calculated lat/lng if needed
                    detections: imageResponse.data.detections.map(det => ({
                        ...det,
                        lat: imageResponse.data.droneLat + det.lat_offset,
                        lng: imageResponse.data.droneLng + det.lng_offset,
                    }))
                });

                const locationsResponse = await axios.get(`${BACKEND_URL}/weed_locations`);
                setWeedLocations(locationsResponse.data);

                const classifiedWeedsResponse = await axios.get(`${BACKEND_URL}/classified_weeds_summary`);
                setClassifiedWeeds(classifiedWeedsResponse.data);

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError(`Failed to load dashboard data. Is the backend running at ${BACKEND_URL}?`);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [BACKEND_URL]);

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
                <h1>Haiti Agri-Tech Dashboard</h1>
                <p>Weed Detection & Management for Farmers</p>
            </header>

            <main style={appStyles.dashboardContent}>
                {loading ? (
                    <div style={appStyles.dashboardLoading}>Loading dashboard data...</div>
                ) : error ? (
                    <div style={appStyles.dashboardError}>{error}</div>
                ) : (
                    <>
                        <section style={{...appStyles.dashboardSection, ...appStyles.imageSection}}>
                            <h2>Latest Drone Capture & Weed Detections</h2>
                            {currentImage && (
                                <ImageDisplay
                                    imageUrl={currentImage.url}
                                    detections={currentImage.detections}
                                />
                            )}
                        </section>

                        <section style={{...appStyles.dashboardSection, ...appStyles.mapSection}}>
                            <h2>Weed Distribution Map</h2>
                            <WeedMap weedLocations={weedLocations} />
                            <p style={appStyles.mapInfo}>Red areas indicate higher weed density.</p>
                        </section>

                        <div style={appStyles.flexContainer}>
                            <section style={{...appStyles.dashboardSection, ...appStyles.treatmentSection, ...appStyles.flexItem}}>
                                <TreatmentPlan classifiedWeeds={classifiedWeeds} />
                            </section>

                            <section style={{...appStyles.dashboardSection, ...appStyles.weatherSection, ...appStyles.flexItem}}>
                                <WeatherForecast />
                            </section>
                        </div>
                    </>
                )}
            </main>

            <footer style={appStyles.dashboardFooter}>
                <p>&copy; 2025 Haiti Hackathon Team. Empowering Farmers with Technology.</p>
            </footer>
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

export default App;