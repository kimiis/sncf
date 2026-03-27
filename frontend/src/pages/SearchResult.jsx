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
import {
    FaTrain, FaRoad, FaClock, FaEuroSign, FaLeaf, FaCar, FaPlane,
    FaHotel, FaBicycle, FaCompass, FaParking, FaBell,
    FaUtensils, FaBeer, FaLandmark, FaTree, FaRunning,
    FaMapMarkerAlt, FaCalendarAlt,
} from "react-icons/fa";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import CO2Equivalences from "../components/CO2Equivalences";
import WeatherWidget from "../components/WeatherWidget";
import ShareButton from "../components/ShareButton";
import "../styles/searchResult.css";

// Fix icones Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const makeIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const hotelIcon    = makeIcon("red");
const bikeIcon     = makeIcon("green");
const activityIcon = makeIcon("orange");
const parkingIcon  = makeIcon("violet");

const ACTIVITY_CATEGORIES = {
    restaurant: { label: "Restos",   icon: <FaUtensils />, types: ["restaurant", "cafe", "fast_food"] },
    bar:        { label: "Bars",     icon: <FaBeer />,     types: ["bar", "pub"] },
    culture:    { label: "Culture",  icon: <FaLandmark />, types: ["museum", "gallery", "theatre", "cinema", "attraction"] },
    park:       { label: "Parcs",    icon: <FaTree />,     types: ["park", "viewpoint"] },
    sport:      { label: "Sports",   icon: <FaRunning />,  types: ["pitch", "sports_centre", "stadium", "swimming_pool"] },
};

function MapAutoResize() {
    const map = useMap();
    useEffect(() => { setTimeout(() => map.invalidateSize(), 200); }, [map]);
    return null;
}

export default function SearchResult() {
    const [params] = useSearchParams();
    const fromCity = params.get("from");
    const toCity   = params.get("to");
    const travelDate = params.get("date") || "";
    const { isAuthenticated, id: userId } = useAuth();

    const [trajet, setTrajet]               = useState(null);
    const [poi, setPoi]                     = useState(null);
    const [poiLoading, setPoiLoading]       = useState(false);
    const [error, setError]                 = useState("");
    const [activeJourneyIdx, setActiveJourneyIdx] = useState(0);
    const [alertPrixOpen, setAlertPrixOpen] = useState(false);
    const [alertPrixVal, setAlertPrixVal]   = useState("");

    const [showHotels,     setShowHotels]     = useState(false);
    const [showBikes,      setShowBikes]      = useState(false);
    const [showActivities, setShowActivities] = useState(false);
    const [showParkings,   setShowParkings]   = useState(false);

    const [activityFilters, setActivityFilters] = useState({
        restaurant: true, bar: true, culture: true, park: true, sport: true,
    });

    const LIMIT_NON_CONNECTED = 10;

    useEffect(() => {
        const fetchTrajet = async () => {
            try {
                const { data } = await api.get("/sncf/trajet", {
                    params: { from_city: fromCity, to_city: toCity },
                });
                setTrajet(data);

                // Toujours sauvegarder en localStorage (fallback fiable)
                const co2Saved = data.co2_voiture_kg && data.co2_train_kg
                    ? (data.co2_voiture_kg - data.co2_train_kg).toFixed(1) : null;
                const trajetData = {
                    id: Date.now(), from: fromCity, to: toCity,
                    date: new Date().toISOString(), duration: data.duree || "N/A",
                    co2Saved: co2Saved ? `${co2Saved} kg` : "N/A",
                    price: data.prix_indicatif ? `${Math.round(data.prix_indicatif)}€` : "N/A",
                };
                const historique = JSON.parse(localStorage.getItem("trajetHistorique") || "[]");
                historique.unshift(trajetData);
                localStorage.setItem("trajetHistorique", JSON.stringify(historique.slice(0, 10)));

                // Tenter la BDD si authentifié
                if (isAuthenticated) {
                    try {
                        await api.post("/trajet/history", {
                            gare_depart: fromCity, gare_arrivee: toCity,
                            duree: data.duree || "N/A",
                            co2_economise: co2Saved ? `${co2Saved} kg` : "N/A",
                            prix: data.prix_indicatif ? `${Math.round(data.prix_indicatif)}€` : "N/A",
                        });
                    } catch {
                        // BDD indisponible — localStorage déjà sauvegardé ci-dessus
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Impossible de récupérer le trajet.");
            }
        };
        fetchTrajet();
    }, [fromCity, toCity, isAuthenticated, userId]);

    useEffect(() => {
        if (!trajet) return;
        const { coordonnees_depart: dep, coordonnees_arrivee: arr } = trajet;
        if (!dep?.latitude || !arr?.latitude) return;
        const fetchPoi = async () => {
            setPoiLoading(true);
            try {
                const { data } = await api.get("/sncf/trajet/poi", {
                    params: {
                        lat_arr: arr.latitude, lon_arr: arr.longitude,
                        lat_dep: dep.latitude, lon_dep: dep.longitude,
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
                gare_depart: fromCity, gare_arrivee: toCity,
                prix_max: parseFloat(alertPrixVal),
            });
            setAlertPrixOpen(false);
            setAlertPrixVal("");
            alert(`Alerte créée ! On vous préviendra si le prix indicatif passe sous ${alertPrixVal}€.`);
        } catch {
            alert("Connectez-vous pour créer une alerte prix.");
        }
    };

    const toggleActivityFilter = (cat) =>
        setActivityFilters(prev => ({ ...prev, [cat]: !prev[cat] }));

    const activityMatchesFilter = (activity) => {
        for (const [key, config] of Object.entries(ACTIVITY_CATEGORIES)) {
            if (config.types.includes(activity.category) && activityFilters[key]) return true;
        }
        return false;
    };

    const countByCategory = (key) => {
        const config = ACTIVITY_CATEGORIES[key];
        return allActivities.filter(a => config.types.includes(a.category)).length;
    };

    if (error)   return <div className="sr-error">{error}</div>;
    if (!trajet) return <div className="sr-loading">Chargement du trajet...</div>;

    const start    = trajet.coordonnees_depart;
    const end      = trajet.coordonnees_arrivee;
    const hasCoords = !!(start?.latitude && end?.latitude);
    const startPos = hasCoords ? [start.latitude, start.longitude] : null;
    const endPos   = hasCoords ? [end.latitude,   end.longitude]   : null;
    const center   = hasCoords
        ? [(startPos[0] + endPos[0]) / 2, (startPos[1] + endPos[1]) / 2]
        : [46.5, 2.5];

    const routeCoords  = trajet.route_coordinates || [];
    const hasRealRoute = routeCoords.length > 0;

    const slice = (arr) => isAuthenticated ? arr : arr.slice(0, LIMIT_NON_CONNECTED);
    const hotels       = slice(poi?.hotels_proches         || []);
    const bikes        = slice(poi?.stations_velo_proches  || []);
    const parkings     = slice(poi?.parkings_proches       || []);
    const allActivities= slice(poi?.activites_proches      || []);
    const filteredActivities = allActivities.filter(activityMatchesFilter);

    const co2Saved = trajet.co2_voiture_kg && trajet.co2_train_kg
        ? trajet.co2_voiture_kg - trajet.co2_train_kg : null;

    const co2Max = Math.max(
        trajet.co2_train_kg || 0,
        trajet.co2_voiture_kg || 0,
        trajet.co2_avion_kg || 0,
    );
    const pct = (val) => co2Max > 0 ? Math.round((val / co2Max) * 100) : 0;

    const prochainsDepartsData = trajet.prochains_departs || [];

    return (
        <div className="sr-page">

            {/* ── HERO ── */}
            <section className="sr-hero">
                <div className="sr-hero-top">
                    <div className="sr-route-block">
                        <h1 className="sr-route-title">
                            <FaTrain className="sr-route-icon" />
                            {trajet.from_city} → {trajet.to_city}
                        </h1>
                        {travelDate && (
                            <span className="sr-date-badge">
                                <FaCalendarAlt /> {travelDate}
                            </span>
                        )}
                    </div>
                    <ShareButton trajet={trajet} />
                </div>
            </section>

            {/* ── STATS CARD ── */}
            <div className="sr-stats-card">
                <div className="sr-stat">
                    <FaClock className="sr-stat-icon" />
                    <span className="sr-stat-val">{trajet.duree || "—"}</span>
                    <span className="sr-stat-label">Durée</span>
                </div>
                <div className="sr-stat-divider" />
                <div className="sr-stat">
                    <FaRoad className="sr-stat-icon" />
                    <span className="sr-stat-val">
                        {trajet.distance_km ? `${Math.round(trajet.distance_km)} km` : "—"}
                    </span>
                    <span className="sr-stat-label">Distance</span>
                </div>
                <div className="sr-stat-divider" />
                <div className="sr-stat">
                    <FaEuroSign className="sr-stat-icon" />
                    <span className="sr-stat-val">
                        {trajet.prix_indicatif ? `${Math.round(trajet.prix_indicatif)} €` : "—"}
                    </span>
                    <span className="sr-stat-label">Prix indicatif</span>
                </div>
            </div>

            {/* ── MÉTÉO ── */}
            {end?.latitude && (
                <WeatherWidget
                    lat={end.latitude}
                    lon={end.longitude}
                    cityName={trajet.to_city}
                    travelDate={travelDate}
                />
            )}

            {/* ── CO2 COMPARATIF ── */}
            {trajet.co2_train_kg && trajet.co2_voiture_kg && (
                <section className="sr-card">
                    <h2 className="sr-section-title">
                        <FaLeaf className="sr-section-icon" /> Impact carbone
                    </h2>
                    <div className="sr-transport-bars">
                        <div className="sr-bar-row">
                            <span className="sr-bar-label"><FaTrain /> Train</span>
                            <div className="sr-bar-track">
                                <div className="sr-bar-fill sr-bar-fill-train"
                                     style={{ width: `${pct(trajet.co2_train_kg)}%` }} />
                            </div>
                            <span className="sr-bar-val">{trajet.co2_train_kg.toFixed(1)} kg</span>
                        </div>
                        <div className="sr-bar-row">
                            <span className="sr-bar-label"><FaCar /> Voiture</span>
                            <div className="sr-bar-track">
                                <div className="sr-bar-fill sr-bar-fill-car"
                                     style={{ width: `${pct(trajet.co2_voiture_kg)}%` }} />
                            </div>
                            <span className="sr-bar-val">{trajet.co2_voiture_kg.toFixed(1)} kg</span>
                        </div>
                        {trajet.co2_avion_kg && (
                            <div className="sr-bar-row">
                                <span className="sr-bar-label"><FaPlane /> Avion</span>
                                <div className="sr-bar-track">
                                    <div className="sr-bar-fill sr-bar-fill-plane"
                                         style={{ width: `${pct(trajet.co2_avion_kg)}%` }} />
                                </div>
                                <span className="sr-bar-val">{trajet.co2_avion_kg.toFixed(1)} kg</span>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ── CO2 ÉQUIVALENCES ── */}
            <CO2Equivalences co2SavedKg={co2Saved} />

            {/* ── PROCHAINS DÉPARTS ── */}
            {prochainsDepartsData.length > 0 && (
                <section className="sr-card">
                    <h2 className="sr-section-title">
                        <FaTrain className="sr-section-icon" /> Prochains départs
                    </h2>
                    <div className="sr-departs-scroll">
                        {prochainsDepartsData.map((dep, idx) => (
                            <button
                                key={idx}
                                className={`sr-depart-chip ${activeJourneyIdx === idx ? "active" : ""}`}
                                onClick={() => setActiveJourneyIdx(idx)}
                            >
                                <span className="sr-depart-times">
                                    {dep.depart?.slice(0,2)}h{dep.depart?.slice(2,4)}
                                    {" → "}
                                    {dep.arrivee?.slice(0,2)}h{dep.arrivee?.slice(2,4)}
                                </span>
                                <span className="sr-depart-dur">{dep.duree}</span>
                                {dep.nb_changements > 0 && (
                                    <span className="sr-depart-chg">{dep.nb_changements} chgt</span>
                                )}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* ── ALERTE PRIX ── */}
            <div className="sr-card">
                {!alertPrixOpen ? (
                    <button className="sr-alert-btn" onClick={() => setAlertPrixOpen(true)}>
                        <FaBell /> Créer une alerte prix
                    </button>
                ) : (
                    <div className="sr-alert-form">
                        <span>Me prévenir si le prix passe sous</span>
                        <input
                            type="number" min="1"
                            value={alertPrixVal}
                            onChange={(e) => setAlertPrixVal(e.target.value)}
                            placeholder="50"
                        />
                        <span>€</span>
                        <button className="sr-alert-save" onClick={handleAlertPrix}>Enregistrer</button>
                        <button className="sr-alert-cancel" onClick={() => setAlertPrixOpen(false)}>Annuler</button>
                    </div>
                )}
            </div>

            {/* ── FILTRES POI ── */}
            <section className="sr-card">
                <h2 className="sr-section-title">
                    <FaCompass className="sr-section-icon" /> Afficher sur la carte
                </h2>
                <div className="sr-filter-pills">
                    <button
                        className={`sr-filter-btn sr-filter-btn-hotel ${showHotels ? "active" : ""}`}
                        onClick={() => setShowHotels(v => !v)}
                    >
                        <FaHotel /> Hôtels <span className="sr-filter-count">{hotels.length}</span>
                    </button>
                    <button
                        className={`sr-filter-btn sr-filter-btn-bike ${showBikes ? "active" : ""}`}
                        onClick={() => setShowBikes(v => !v)}
                    >
                        <FaBicycle /> Vélos <span className="sr-filter-count">{bikes.length}</span>
                    </button>
                    <button
                        className={`sr-filter-btn sr-filter-btn-activity ${showActivities ? "active" : ""}`}
                        onClick={() => setShowActivities(v => !v)}
                    >
                        <FaCompass /> Activités <span className="sr-filter-count">{allActivities.length}</span>
                    </button>
                    <button
                        className={`sr-filter-btn sr-filter-btn-parking ${showParkings ? "active" : ""}`}
                        onClick={() => setShowParkings(v => !v)}
                    >
                        <FaParking /> Parkings <span className="sr-filter-count">{parkings.length}</span>
                    </button>
                </div>

                {showActivities && (
                    <div className="sr-sub-filters">
                        <p className="sr-sub-label">Filtrer par type :</p>
                        <div className="sr-sub-pills">
                            {Object.entries(ACTIVITY_CATEGORIES).map(([key, config]) => (
                                <button
                                    key={key}
                                    className={`sr-sub-btn ${activityFilters[key] ? "active" : ""}`}
                                    onClick={() => toggleActivityFilter(key)}
                                >
                                    {config.icon} {config.label} ({countByCategory(key)})
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {!isAuthenticated && (
                    <p className="sr-limit-warn">
                        Connectez-vous pour voir tous les résultats (limité à {LIMIT_NON_CONNECTED} par catégorie)
                    </p>
                )}
            </section>

            {/* ── POI LOADING ── */}
            {poiLoading && (
                <p className="sr-poi-loading">
                    <FaCompass /> Chargement des points d'intérêt...
                </p>
            )}

            {/* ── CARTE ── */}
            <div className="sr-map">
                <MapContainer
                    key={`${center[0]}-${center[1]}`}
                    center={center}
                    zoom={hasCoords ? 6 : 5}
                    scrollWheelZoom={true}
                >
                    <MapAutoResize />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {hasCoords && <Marker position={startPos}><Popup>Départ : {trajet.from_city}</Popup></Marker>}
                    {hasCoords && <Marker position={endPos}><Popup>Arrivée : {trajet.to_city}</Popup></Marker>}

                    {hasCoords && hasRealRoute ? (
                        <Polyline positions={routeCoords} color="#8B9E6A" weight={5} opacity={0.85} />
                    ) : hasCoords ? (
                        <Polyline positions={[startPos, endPos]} color="#8B9E6A" weight={4} dashArray="10,10" opacity={0.7} />
                    ) : null}

                    {showHotels && hotels.map((h, i) => h.lat && h.lon && (
                        <Marker key={`hotel-${i}`} position={[h.lat, h.lon]} icon={hotelIcon}>
                            <Popup><strong>{h.name}</strong><br />{h.distance_km_from_station} km de la gare</Popup>
                        </Marker>
                    ))}

                    {showBikes && bikes.map((b, i) => b.lat && b.lon && (
                        <Marker key={`bike-${i}`} position={[b.lat, b.lon]} icon={bikeIcon}>
                            <Popup>
                                <strong>{b.name || "Station vélo"}</strong><br />
                                {b.distance_km_from_station} km de la gare<br />
                                {b.type === "bicycle_rental" ? "Location" : "Parking vélo"}
                            </Popup>
                        </Marker>
                    ))}

                    {showActivities && filteredActivities.map((a, i) => a.lat && a.lon && (
                        <Marker key={`act-${i}`} position={[a.lat, a.lon]} icon={activityIcon}>
                            <Popup>
                                <strong>{a.name || "Activité"}</strong><br />
                                {a.distance_km_from_station} km · {a.category}
                            </Popup>
                        </Marker>
                    ))}

                    {showParkings && parkings.map((p, i) => p.lat && p.lon && (
                        <Marker key={`park-${i}`} position={[p.lat, p.lon]} icon={parkingIcon}>
                            <Popup>
                                <strong>{p.name}</strong><br />
                                {p.distance_km_from_station} km de la gare
                                {p.capacity && <><br />{p.capacity} places</>}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* ── LISTES POI ── */}

            {showHotels && hotels.length > 0 && (
                <section className="sr-poi-section sr-poi-hotels">
                    <h3 className="sr-poi-section-title"><FaHotel /> Hôtels près de {trajet.to_city}</h3>
                    <div className="sr-poi-scroll">
                        {hotels.map((h, i) => (
                            <div key={i} className="sr-poi-card">
                                <div className="sr-poi-card-name">{h.name}</div>
                                <div className="sr-poi-card-dist"><FaMapMarkerAlt /> {h.distance_km_from_station} km</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {showBikes && bikes.length > 0 && (
                <section className="sr-poi-section sr-poi-bikes">
                    <h3 className="sr-poi-section-title"><FaBicycle /> Vélos près de {trajet.to_city}</h3>
                    <div className="sr-poi-scroll">
                        {bikes.map((b, i) => (
                            <div key={i} className="sr-poi-card">
                                <div className="sr-poi-card-name">{b.name || "Station vélo"}</div>
                                <div className="sr-poi-card-dist"><FaMapMarkerAlt /> {b.distance_km_from_station} km</div>
                                <span className="sr-poi-card-tag">
                                    {b.type === "bicycle_rental" ? "Location" : "Parking vélo"}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {showActivities && filteredActivities.length > 0 && (
                <section className="sr-poi-section sr-poi-activities">
                    <h3 className="sr-poi-section-title"><FaCompass /> Activités près de {trajet.to_city}</h3>
                    <div className="sr-poi-scroll">
                        {filteredActivities.map((a, i) => (
                            <div key={i} className="sr-poi-card">
                                <div className="sr-poi-card-name">{a.name || "Activité"}</div>
                                <div className="sr-poi-card-dist"><FaMapMarkerAlt /> {a.distance_km_from_station} km</div>
                                <span className="sr-poi-card-tag">{a.category}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {showParkings && parkings.length > 0 && (
                <section className="sr-poi-section sr-poi-parkings">
                    <h3 className="sr-poi-section-title"><FaParking /> Parkings près de {trajet.from_city}</h3>
                    <div className="sr-poi-scroll">
                        {parkings.map((p, i) => (
                            <div key={i} className="sr-poi-card">
                                <div className="sr-poi-card-name">{p.name}</div>
                                <div className="sr-poi-card-dist"><FaMapMarkerAlt /> {p.distance_km_from_station} km</div>
                                {p.capacity && <span className="sr-poi-card-tag">{p.capacity} places</span>}
                                {p.fee && (
                                    <span className="sr-poi-card-tag">
                                        {p.fee === "yes" ? "Payant" : p.fee === "no" ? "Gratuit" : "Tarif inconnu"}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

        </div>
    );
}
