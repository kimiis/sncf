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
import CO2Equivalences from "../components/CO2Equivalences";
import WeatherWidget from "../components/WeatherWidget";
import ShareButton from "../components/ShareButton";
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

const parkingIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Categories d'activites
const ACTIVITY_CATEGORIES = {
    restaurant: { label: "Restaurants & Cafes", icon: "🍽️", types: ["restaurant", "cafe", "fast_food"] },
    bar: { label: "Bars & Pubs", icon: "🍺", types: ["bar", "pub"] },
    culture: { label: "Culture", icon: "🎭", types: ["museum", "gallery", "theatre", "cinema", "attraction"] },
    park: { label: "Parcs & Nature", icon: "🌳", types: ["park", "viewpoint"] },
    sport: { label: "Sports", icon: "⚽", types: ["pitch", "sports_centre", "stadium", "swimming_pool"] },
};

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
    const { isAuthenticated, id: userId } = useAuth();

    const travelDate = params.get("date") || "";
    const [trajet, setTrajet] = useState(null);
    const [poi, setPoi] = useState(null);
    const [poiLoading, setPoiLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeJourneyIdx, setActiveJourneyIdx] = useState(0);
    const [alertPrixOpen, setAlertPrixOpen] = useState(false);
    const [alertPrixVal, setAlertPrixVal] = useState("");

    // Etats des filtres principaux
    const [showHotels, setShowHotels] = useState(false);
    const [showBikes, setShowBikes] = useState(false);
    const [showActivities, setShowActivities] = useState(false);
    const [showParkings, setShowParkings] = useState(false);

    // Etats des sous-filtres activites
    const [activityFilters, setActivityFilters] = useState({
        restaurant: true,
        bar: true,
        culture: true,
        park: true,
        sport: true,
    });

    // Limite pour les utilisateurs non connectes
    const LIMIT_NON_CONNECTED = 10;

    // 1. Charger les infos du trajet (rapide, sans POI)
    useEffect(() => {
        const fetchTrajet = async () => {
            try {
                const { data } = await api.get("/sncf/trajet", {
                    params: { from_city: fromCity, to_city: toCity },
                });
                setTrajet(data);

                // Sauvegarder dans la BDD si connecté, sinon localStorage
                if (data && isAuthenticated) {
                    const co2Saved = data.co2_voiture_kg && data.co2_train_kg
                        ? (data.co2_voiture_kg - data.co2_train_kg).toFixed(1)
                        : null;
                    try {
                        await api.post("/trajet/history", {
                            gare_depart: fromCity,
                            gare_arrivee: toCity,
                            duree: data.duree || "N/A",
                            co2_economise: co2Saved ? `${co2Saved} kg` : "N/A",
                            prix: data.prix_moyen ? `${Math.round(data.prix_moyen)}€` : "N/A",
                        });
                    } catch {
                        // Fallback localStorage si BDD indisponible
                        const trajetData = {
                            id: Date.now(),
                            from: fromCity,
                            to: toCity,
                            date: new Date().toISOString(),
                            duration: data.duree || "N/A",
                            co2Saved: co2Saved ? `${co2Saved} kg` : "N/A",
                            price: data.prix_moyen ? `${Math.round(data.prix_moyen)}€` : "N/A",
                        };
                        const historique = JSON.parse(localStorage.getItem("trajetHistorique") || "[]");
                        historique.unshift(trajetData);
                        localStorage.setItem("trajetHistorique", JSON.stringify(historique.slice(0, 10)));
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Impossible de recuperer le trajet.");
            }
        };
        fetchTrajet();
    }, [fromCity, toCity, isAuthenticated, userId]);

    // 2. Charger les POI une fois les coordonnées disponibles
    useEffect(() => {
        if (!trajet) return;
        const { coordonnees_depart: dep, coordonnees_arrivee: arr } = trajet;
        if (!dep?.latitude || !arr?.latitude) return;

        const fetchPoi = async () => {
            setPoiLoading(true);
            try {
                const { data } = await api.get("/sncf/trajet/poi", {
                    params: {
                        lat_arr: arr.latitude,
                        lon_arr: arr.longitude,
                        lat_dep: dep.latitude,
                        lon_dep: dep.longitude,
                    },
                });
                setPoi(data);
            } catch (err) {
                console.error("Erreur POI:", err);
            } finally {
                setPoiLoading(false);
            }
        };
        fetchPoi();
    }, [trajet]);

    const handleAlertPrix = async () => {
        if (!alertPrixVal) return;
        try {
            await api.post("/stats/price-alert", {
                gare_depart: fromCity,
                gare_arrivee: toCity,
                prix_max: parseFloat(alertPrixVal),
            });
            setAlertPrixOpen(false);
            setAlertPrixVal("");
            alert(`Alerte créée ! On vous préviendra si le prix indicatif passe sous ${alertPrixVal}€.`);
        } catch {
            alert("Connectez-vous pour créer une alerte prix.");
        }
    };

    // Toggle un sous-filtre d'activite
    const toggleActivityFilter = (category) => {
        setActivityFilters(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Verifier si une activite correspond aux filtres selectionnes
    const activityMatchesFilter = (activity) => {
        const category = activity.category;
        for (const [key, config] of Object.entries(ACTIVITY_CATEGORIES)) {
            if (config.types.includes(category) && activityFilters[key]) {
                return true;
            }
        }
        return false;
    };

    if (error) return <p className="error">{error}</p>;
    if (!trajet) return <p>Chargement du trajet...</p>;

    // Extraction des coordonnees
    const start = trajet.coordonnees_depart;
    const end = trajet.coordonnees_arrivee;
    const hasCoords = !!(start?.latitude && end?.latitude);

    const startPos = hasCoords ? [start.latitude, start.longitude] : null;
    const endPos = hasCoords ? [end.latitude, end.longitude] : null;
    const center = hasCoords
        ? [(startPos[0] + endPos[0]) / 2, (startPos[1] + endPos[1]) / 2]
        : [46.5, 2.5]; // centre de la France

    // Coordonnées du tracé réel du train (si disponibles)
    const routeCoords = trajet.route_coordinates || [];
    const hasRealRoute = routeCoords.length > 0;

    // Donnees des POI avec limite selon connexion
    const hotels = isAuthenticated
        ? poi?.hotels_proches || []
        : (poi?.hotels_proches || []).slice(0, LIMIT_NON_CONNECTED);

    const bikes = isAuthenticated
        ? poi?.stations_velo_proches || []
        : (poi?.stations_velo_proches || []).slice(0, LIMIT_NON_CONNECTED);

    const parkings = isAuthenticated
        ? poi?.parkings_proches || []
        : (poi?.parkings_proches || []).slice(0, LIMIT_NON_CONNECTED);

    const allActivities = isAuthenticated
        ? poi?.activites_proches || []
        : (poi?.activites_proches || []).slice(0, LIMIT_NON_CONNECTED);

    // Filtrer les activites selon les sous-filtres
    const filteredActivities = allActivities.filter(activityMatchesFilter);

    // Compter les activites par categorie
    const countByCategory = (categoryKey) => {
        const config = ACTIVITY_CATEGORIES[categoryKey];
        return allActivities.filter(a => config.types.includes(a.category)).length;
    };

    const co2Saved = trajet.co2_voiture_kg && trajet.co2_train_kg
        ? trajet.co2_voiture_kg - trajet.co2_train_kg
        : null;

    const prochainsDepartsData = trajet.prochains_departs || [];

    return (
        <div className="search-result-page">
            {/* Header avec partage */}
            <div className="result-header">
                <h2>🚆 {trajet.from_city} → {trajet.to_city}</h2>
                <ShareButton trajet={trajet} />
            </div>

            {/* Météo à destination */}
            {end?.latitude && (
                <WeatherWidget
                    lat={end.latitude}
                    lon={end.longitude}
                    cityName={trajet.to_city}
                    travelDate={travelDate}
                />
            )}

            {/* Infos du trajet */}
            <div className="trajet-info">
                <p><strong>Durée :</strong> {trajet.duree || "Non disponible"}</p>
                <p><strong>Distance :</strong> {trajet.distance_km?.toFixed(1) || "N/A"} km</p>
                <p>
                    <strong>Prix indicatif :</strong>{" "}
                    {trajet.prix_indicatif ? `${Math.round(trajet.prix_indicatif)} €` : "N/A"}
                    <span className="prix-note"> (tarif de référence SNCF Open Data)</span>
                </p>
                <p className="co2-info">🌱 Train : {trajet.co2_train_kg?.toFixed(2) || "N/A"} kg CO₂</p>
                <p className="co2-info">🚗 Voiture : {trajet.co2_voiture_kg?.toFixed(2) || "N/A"} kg CO₂</p>
                {trajet.co2_avion_kg && (
                    <p className="co2-info">✈️ Avion : {trajet.co2_avion_kg?.toFixed(2)} kg CO₂
                        <span className="avion-note"> ({Math.round(trajet.co2_avion_kg / (trajet.co2_train_kg || 1))}x plus polluant)</span>
                    </p>
                )}
            </div>

            {/* Comparatif transport */}
            {trajet.co2_train_kg && trajet.co2_voiture_kg && (
                <div className="transport-comparison">
                    <h3>Comparatif CO₂ par transport</h3>
                    <div className="transport-bars">
                        {[
                            { label: "🚆 Train", val: trajet.co2_train_kg, color: "#009485" },
                            { label: "🚗 Voiture", val: trajet.co2_voiture_kg, color: "#e74c3c" },
                            ...(trajet.co2_avion_kg ? [{ label: "✈️ Avion", val: trajet.co2_avion_kg, color: "#e67e22" }] : []),
                        ].map(({ label, val, color }) => {
                            const max = Math.max(trajet.co2_train_kg, trajet.co2_voiture_kg, trajet.co2_avion_kg || 0);
                            const pct = Math.round((val / max) * 100);
                            return (
                                <div key={label} className="transport-bar-row">
                                    <span className="transport-bar-label">{label}</span>
                                    <div className="transport-bar-track">
                                        <div className="transport-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                    <span className="transport-bar-val">{val.toFixed(1)} kg</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CO2 équivalences */}
            <CO2Equivalences co2SavedKg={co2Saved} />

            {/* Prochains départs */}
            {prochainsDepartsData.length > 0 && (
                <div className="prochains-departs">
                    <h3>Prochains départs</h3>
                    <div className="departs-tabs">
                        {prochainsDepartsData.map((dep, idx) => (
                            <button
                                key={idx}
                                className={`depart-tab ${activeJourneyIdx === idx ? "active" : ""}`}
                                onClick={() => setActiveJourneyIdx(idx)}
                            >
                                <span className="depart-time">{dep.depart?.slice(0,2)}h{dep.depart?.slice(2,4)}</span>
                                <span className="depart-arrow">→</span>
                                <span className="depart-time">{dep.arrivee?.slice(0,2)}h{dep.arrivee?.slice(2,4)}</span>
                                <span className="depart-duree">{dep.duree}</span>
                                {dep.nb_changements > 0 && (
                                    <span className="depart-changes">{dep.nb_changements} chgt</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Alerte prix */}
            <div className="alert-prix-section">
                {!alertPrixOpen ? (
                    <button className="alert-prix-btn" onClick={() => setAlertPrixOpen(true)}>
                        🔔 Créer une alerte prix
                    </button>
                ) : (
                    <div className="alert-prix-form">
                        <span>Me prévenir si le prix indicatif passe sous</span>
                        <input
                            type="number"
                            min="1"
                            value={alertPrixVal}
                            onChange={(e) => setAlertPrixVal(e.target.value)}
                            placeholder="ex: 50"
                        />
                        <span>€</span>
                        <button className="alert-prix-save" onClick={handleAlertPrix}>Enregistrer</button>
                        <button className="alert-prix-cancel" onClick={() => setAlertPrixOpen(false)}>Annuler</button>
                    </div>
                )}
            </div>

            {/* Indicateur chargement POI */}
            {poiLoading && (
                <p className="poi-loading">Chargement des points d'intérêt...</p>
            )}

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
                        Activites ({allActivities.length})
                    </label>
                    <label className="filter-item filter-parking">
                        <input
                            type="checkbox"
                            checked={showParkings}
                            onChange={(e) => setShowParkings(e.target.checked)}
                        />
                        <span className="filter-icon">🅿️</span>
                        Parkings ({parkings.length})
                    </label>
                </div>

                {/* Sous-filtres activites */}
                {showActivities && (
                    <div className="sub-filters">
                        <h4>Filtrer par type d'activite :</h4>
                        <div className="sub-filters-grid">
                            {Object.entries(ACTIVITY_CATEGORIES).map(([key, config]) => (
                                <label key={key} className={`sub-filter-item ${activityFilters[key] ? 'active' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={activityFilters[key]}
                                        onChange={() => toggleActivityFilter(key)}
                                    />
                                    <span className="sub-filter-icon">{config.icon}</span>
                                    {config.label} ({countByCategory(key)})
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {!isAuthenticated && (
                    <p className="limit-warning">
                        Connectez-vous pour voir tous les resultats (limite a {LIMIT_NON_CONNECTED} par categorie)
                    </p>
                )}
            </div>

            {/* Carte */}
            <div className="map-container">
                <MapContainer
                    key={`${center[0]}-${center[1]}`}
                    center={center}
                    zoom={hasCoords ? 6 : 5}
                    scrollWheelZoom={true}
                >
                <MapAutoResize />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {hasCoords && <Marker position={startPos}><Popup>Depart : {trajet.from_city}</Popup></Marker>}
                {hasCoords && <Marker position={endPos}><Popup>Arrivee : {trajet.to_city}</Popup></Marker>}

                {/* Tracé du trajet : réel si disponible, sinon ligne droite */}
                {hasCoords && hasRealRoute ? (
                    <Polyline
                        positions={routeCoords}
                        color="#009485"
                        weight={5}
                        opacity={0.8}
                    />
                ) : hasCoords ? (
                    <Polyline
                        positions={[startPos, endPos]}
                        color="#8B9E6A"
                        weight={4}
                        dashArray="10, 10"
                        opacity={0.7}
                    />
                ) : null}

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
                                Type : {bike.type === "bicycle_rental" ? "🔑 Location" : "🅿️ Parking vélo"}
                            </Popup>
                        </Marker>
                    )
                ))}

                {/* Marqueurs Activites filtrees */}
                {showActivities && filteredActivities.map((activity, idx) => (
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

                {/* Marqueurs Parkings */}
                {showParkings && parkings.map((parking, idx) => (
                    parking.lat && parking.lon && (
                        <Marker
                            key={`parking-${idx}`}
                            position={[parking.lat, parking.lon]}
                            icon={parkingIcon}
                        >
                            <Popup>
                                <strong>🅿️ {parking.name}</strong><br />
                                📍 {parking.distance_km_from_station} km de la gare<br />
                                {parking.capacity && <span>Capacite : {parking.capacity} places<br /></span>}
                                {parking.fee && <span>Payant : {parking.fee === "yes" ? "Oui" : parking.fee === "no" ? "Non" : "Inconnu"}</span>}
                            </Popup>
                        </Marker>
                    )
                ))}
                </MapContainer>
            </div>

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

                {/* Liste Activites filtrees */}
                {showActivities && filteredActivities.length > 0 && (
                    <div className="poi-section poi-activities">
                        <h3>🎭 Activites a proximite de {trajet.to_city} ({filteredActivities.length})</h3>
                        <div className="poi-grid">
                            {filteredActivities.map((activity, idx) => (
                                <div key={`activity-list-${idx}`} className="poi-card">
                                    <h4>{activity.name || "Activite"}</h4>
                                    <p>📍 {activity.distance_km_from_station} km de la gare</p>
                                    <p className="poi-category">{activity.category}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Liste Parkings */}
                {showParkings && parkings.length > 0 && (
                    <div className="poi-section poi-parkings">
                        <h3>🅿️ Parkings a proximite de {trajet.to_city}</h3>
                        <div className="poi-grid">
                            {parkings.map((parking, idx) => (
                                <div key={`parking-list-${idx}`} className="poi-card">
                                    <h4>{parking.name}</h4>
                                    <p>📍 {parking.distance_km_from_station} km de la gare</p>
                                    {parking.capacity && (
                                        <p className="poi-type">📊 Capacite : {parking.capacity} places</p>
                                    )}
                                    {parking.fee && (
                                        <p className="poi-type">
                                            💰 {parking.fee === "yes" ? "Payant" : parking.fee === "no" ? "Gratuit" : "Tarif inconnu"}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
