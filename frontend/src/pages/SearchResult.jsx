import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import "../styles/searchBar.css";
import "../styles/searchResult.css";

// Fix icones Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Icones personnalisees pour chaque type de POI
const hotelIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const bikeIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const activityIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Composant pour recalculer la taille de la carte
function MapAutoResize() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }, [map]);
    return null;
}

export default function SearchResult() {
    const [params] = useSearchParams();
    const fromCity = params.get("from");
    const toCity = params.get("to");
    const { isAuthenticated } = useAuth();

    const [trajet, setTrajet] = useState(null);
    const [error, setError] = useState("");

    // Etats des filtres
    const [showHotels, setShowHotels] = useState(false);
    const [showBikes, setShowBikes] = useState(false);
    const [showActivities, setShowActivities] = useState(false);

    // Limite pour les utilisateurs non connectes
    const LIMIT_NON_CONNECTED = 10;

    // Recuperation du trajet via l'API
    useEffect(() => {
        const fetchTrajet = async () => {
            try {
                const { data } = await api.get("/sncf/trajet", {
                    params: { from_city: fromCity, to_city: toCity },
                });
                setTrajet(data);
            } catch (err) {
                console.error(err);
                setError("Impossible de recuperer le trajet.");
            }
        };
        fetchTrajet();
    }, [fromCity, toCity]);

    if (error) return <p className="error">{error}</p>;
    if (!trajet) return <p>Chargement du trajet...</p>;

    // Extraction des coordonnees
    const start = trajet.coordonnees_depart;
    const end = trajet.coordonnees_arrivee;

    // Verifier que les coordonnees existent
    if (!start?.latitude || !end?.latitude) {
        return <p className="error">Coordonnees de trajet non disponibles</p>;
    }

    const startPos = [start.latitude, start.longitude];
    const endPos = [end.latitude, end.longitude];
    const center = [
        (startPos[0] + endPos[0]) / 2,
        (startPos[1] + endPos[1]) / 2,
    ];

    // Donnees des POI avec limite selon connexion
    const hotels = isAuthenticated
        ? trajet.hotels_proches || []
        : (trajet.hotels_proches || []).slice(0, LIMIT_NON_CONNECTED);

    const bikes = isAuthenticated
        ? trajet.stations_velo_proches || []
        : (trajet.stations_velo_proches || []).slice(0, LIMIT_NON_CONNECTED);

    const activities = isAuthenticated
        ? trajet.activites_proches || []
        : (trajet.activites_proches || []).slice(0, LIMIT_NON_CONNECTED);

    return (
        <div className="search-result-page">
            <h2>
                Trajet {trajet.from_city} → {trajet.to_city}
            </h2>

            <div className="trajet-info">
                <p><strong>Duree :</strong> {trajet.duree || "Non disponible"}</p>
                <p><strong>Distance :</strong> {trajet.distance_km?.toFixed(1) || "N/A"} km</p>
                <p><strong>Prix moyen :</strong> {trajet.prix_moyen?.toFixed(2) || "N/A"} €</p>
                <p className="co2-info">🌱 Train : {trajet.co2_train_kg?.toFixed(2) || "N/A"} kg CO2</p>
                <p className="co2-info">🚗 Voiture : {trajet.co2_voiture_kg?.toFixed(2) || "N/A"} kg CO2</p>
            </div>

            {/* Filtres */}
            <div className="filters-container">
                <h3>Afficher sur la carte :</h3>
                <div className="filters">
                    <label className="filter-item filter-hotel">
                        <input
                            type="checkbox"
                            checked={showHotels}
                            onChange={(e) => setShowHotels(e.target.checked)}
                        />
                        <span className="filter-icon">🏨</span>
                        Hotels ({hotels.length})
                    </label>
                    <label className="filter-item filter-bike">
                        <input
                            type="checkbox"
                            checked={showBikes}
                            onChange={(e) => setShowBikes(e.target.checked)}
                        />
                        <span className="filter-icon">🚲</span>
                        Velos ({bikes.length})
                    </label>
                    <label className="filter-item filter-activity">
                        <input
                            type="checkbox"
                            checked={showActivities}
                            onChange={(e) => setShowActivities(e.target.checked)}
                        />
                        <span className="filter-icon">🎭</span>
                        Activites ({activities.length})
                    </label>
                </div>
                {!isAuthenticated && (
                    <p className="limit-warning">
                        Connectez-vous pour voir tous les resultats (limite a {LIMIT_NON_CONNECTED} par categorie)
                    </p>
                )}
            </div>

            {/* Carte */}
            <MapContainer
                key={`${startPos[0]}-${endPos[0]}`}
                center={center}
                zoom={6}
                scrollWheelZoom={true}
                style={{ height: "500px", width: "100%" }}
            >
                <MapAutoResize />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={startPos}>
                    <Popup>Depart : {trajet.from_city}</Popup>
                </Marker>

                <Marker position={endPos}>
                    <Popup>Arrivee : {trajet.to_city}</Popup>
                </Marker>

                <Polyline positions={[startPos, endPos]} color="blue" weight={4} />

                {/* Marqueurs Hotels */}
                {showHotels && hotels.map((hotel, idx) => (
                    hotel.lat && hotel.lon && (
                        <Marker
                            key={`hotel-${idx}`}
                            position={[hotel.lat, hotel.lon]}
                            icon={hotelIcon}
                        >
                            <Popup>
                                <strong>🏨 {hotel.name}</strong><br />
                                📍 {hotel.distance_km_from_station} km de la gare
                            </Popup>
                        </Marker>
                    )
                ))}

                {/* Marqueurs Velos */}
                {showBikes && bikes.map((bike, idx) => (
                    bike.lat && bike.lon && (
                        <Marker
                            key={`bike-${idx}`}
                            position={[bike.lat, bike.lon]}
                            icon={bikeIcon}
                        >
                            <Popup>
                                <strong>🚲 {bike.name || "Station velo"}</strong><br />
                                📍 {bike.distance_km_from_station} km de la gare<br />
                                Type : {bike.type === "bicycle_rental" ? "Location" : "Parking"}
                            </Popup>
                        </Marker>
                    )
                ))}

                {/* Marqueurs Activites */}
                {showActivities && activities.map((activity, idx) => (
                    activity.lat && activity.lon && (
                        <Marker
                            key={`activity-${idx}`}
                            position={[activity.lat, activity.lon]}
                            icon={activityIcon}
                        >
                            <Popup>
                                <strong>🎭 {activity.name || "Activite"}</strong><br />
                                📍 {activity.distance_km_from_station} km de la gare<br />
                                Categorie : {activity.category}
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>

            {/* Listes des POI */}
            <div className="poi-lists">
                {/* Liste Hotels */}
                {showHotels && hotels.length > 0 && (
                    <div className="poi-section poi-hotels">
                        <h3>🏨 Hotels a proximite de {trajet.to_city}</h3>
                        <div className="poi-grid">
                            {hotels.map((hotel, idx) => (
                                <div key={`hotel-list-${idx}`} className="poi-card">
                                    <h4>{hotel.name}</h4>
                                    <p>📍 {hotel.distance_km_from_station} km de la gare</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Liste Velos */}
                {showBikes && bikes.length > 0 && (
                    <div className="poi-section poi-bikes">
                        <h3>🚲 Stations velo a proximite de {trajet.to_city}</h3>
                        <div className="poi-grid">
                            {bikes.map((bike, idx) => (
                                <div key={`bike-list-${idx}`} className="poi-card">
                                    <h4>{bike.name || "Station velo"}</h4>
                                    <p>📍 {bike.distance_km_from_station} km de la gare</p>
                                    <p className="poi-type">
                                        {bike.type === "bicycle_rental" ? "🔑 Location" : "🅿️ Parking"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Liste Activites */}
                {showActivities && activities.length > 0 && (
                    <div className="poi-section poi-activities">
                        <h3>🎭 Activites a proximite de {trajet.to_city}</h3>
                        <div className="poi-grid">
                            {activities.map((activity, idx) => (
                                <div key={`activity-list-${idx}`} className="poi-card">
                                    <h4>{activity.name || "Activite"}</h4>
                                    <p>📍 {activity.distance_km_from_station} km de la gare</p>
                                    <p className="poi-category">{activity.category}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
