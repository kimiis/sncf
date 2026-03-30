import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaTrain, FaLeaf, FaMapMarkedAlt } from "react-icons/fa";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";
import "../styles/inspiration.css";

const TAGS_FILTERS = [
    { key: "all", label: "Toutes" },
    { key: "mer", label: "Mer & Plage" },
    { key: "montagne", label: "Montagne" },
    { key: "culture", label: "Culture" },
    { key: "gastronomie", label: "Gastronomie" },
    { key: "nature", label: "Nature" },
];

export default function Inspiration() {
    const navigate = useNavigate();
    const [destinations, setDestinations] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [activeTag, setActiveTag] = useState("all");
    const [fromCity, setFromCity] = useState("Paris");
    const [loading, setLoading] = useState(true);

    const [isochroneDuration, setIsochroneDuration] = useState(7200);
    const [isochroneGeo, setIsochroneGeo] = useState(null);
    const [isochroneLoading, setIsochroneLoading] = useState(false);
    const [isochroneError, setIsochroneError] = useState("");

    useEffect(() => {
        api.get("/sncf/destinations")
            .then(({ data }) => {
                setDestinations(data);
                setFiltered(data);
            })
            .catch(() => setDestinations([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let result = destinations;
        if (activeTag !== "all") {
            result = result.filter((d) => d.tags?.includes(activeTag));
        }
        setFiltered(result);
    }, [activeTag, destinations]);

    const handleSearch = (destName) => {
        navigate(`/search?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(destName)}`);
    };

    const fetchIsochrone = () => {
        if (!fromCity.trim()) return;
        setIsochroneLoading(true);
        setIsochroneError("");
        setIsochroneGeo(null);
        api.get("/sncf/isochrones", { params: { from_city: fromCity, max_duration: isochroneDuration } })
            .then(({ data }) => {
                if (data.geojson) setIsochroneGeo(data.geojson);
                else setIsochroneError("Aucune donnée disponible pour cette gare.");
            })
            .catch(() => setIsochroneError("Erreur lors du calcul. Vérifiez le nom de la gare."))
            .finally(() => setIsochroneLoading(false));
    };

    // Convert GeoJSON [lon, lat] → Leaflet [lat, lon]
    const geoJsonToLeaflet = (geojson) => {
        if (!geojson) return null;
        const coords = geojson.coordinates;
        if (geojson.type === "Polygon") {
            return coords[0].map(([lon, lat]) => [lat, lon]);
        }
        if (geojson.type === "MultiPolygon") {
            return coords.map(polygon => polygon[0].map(([lon, lat]) => [lat, lon]));
        }
        return null;
    };

    return (
        <div className="inspiration-page">
            <header className="inspiration-header">
                <h1>Trouvez votre prochaine escapade</h1>
                <p>Partez en train, voyagez responsable</p>
            </header>

            {/* Ville de départ */}
            <section className="inspiration-depart">
                <label>
                    <FaTrain /> Depuis :
                    <input
                        type="text"
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                        placeholder="Votre ville de départ"
                    />
                </label>
            </section>

            {/* Filtres par tag */}
            <div className="inspiration-filters">
                {TAGS_FILTERS.map(({ key, label }) => (
                    <button
                        key={key}
                        className={`tag-btn ${activeTag === key ? "active" : ""}`}
                        onClick={() => setActiveTag(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── ISOCHRONE ── */}
            <section className="isochrone-section">
                <h2 className="isochrone-title"><FaMapMarkedAlt /> Jusqu'où puis-je aller ?</h2>
                <div className="isochrone-controls">
                    <input
                        className="isochrone-input"
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                        placeholder="Gare de départ"
                    />
                    <div className="isochrone-durations">
                        {[3600, 7200, 10800].map(d => (
                            <button
                                key={d}
                                className={`isochrone-dur-btn ${isochroneDuration === d ? "active" : ""}`}
                                onClick={() => setIsochroneDuration(d)}
                            >
                                {d / 3600}h
                            </button>
                        ))}
                    </div>
                    <button className="isochrone-go-btn" onClick={fetchIsochrone} disabled={isochroneLoading}>
                        {isochroneLoading ? "Calcul…" : "Voir la zone"}
                    </button>
                </div>
                {isochroneError && <p className="isochrone-error">{isochroneError}</p>}
                {isochroneGeo && (() => {
                    const positions = geoJsonToLeaflet(isochroneGeo);
                    if (!positions) return null;
                    const isMulti = Array.isArray(positions[0]?.[0]);
                    return (
                        <div className="isochrone-map">
                            <MapContainer center={[46.5, 2.5]} zoom={5} style={{ height: "380px", width: "100%" }} scrollWheelZoom={false}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {isMulti
                                    ? positions.map((p, i) => (
                                        <Polygon key={i} positions={p} pathOptions={{ color: "#2D5443", fillColor: "#8B9E6A", fillOpacity: 0.35 }} />
                                    ))
                                    : <Polygon positions={positions} pathOptions={{ color: "#2D5443", fillColor: "#8B9E6A", fillOpacity: 0.35 }} />
                                }
                            </MapContainer>
                            <p className="isochrone-legend">Zone verte = destinations accessibles en {isochroneDuration / 3600}h depuis {fromCity}</p>
                        </div>
                    );
                })()}
            </section>

            {/* Grille destinations */}
            {loading ? (
                <p className="inspiration-loading">Chargement des destinations...</p>
            ) : filtered.length === 0 ? (
                <p className="inspiration-empty">Aucune destination pour ces filtres.</p>
            ) : (
                <div className="inspiration-grid">
                    {filtered.map((dest) => (
                        <div
                            key={dest.id}
                            className="inspiration-card"
                            onClick={() => handleSearch(dest.name)}
                        >
                            <div
                                className="inspiration-img-wrapper"
                                style={!dest.image ? { background: "linear-gradient(135deg, #2D5443, #8B9E6A)" } : {}}
                            >
                                {dest.image && (
                                    <img
                                        src={dest.image}
                                        alt={dest.name}
                                        className="inspiration-img"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.parentElement.style.background = "linear-gradient(135deg, #2D5443, #8B9E6A)";
                                        }}
                                    />
                                )}
                                <div className="inspiration-overlay">
                                    <button className="inspiration-cta">
                                        <FaSearch /> Voir les trajets
                                    </button>
                                </div>
                            </div>
                            <div className="inspiration-card-body">
                                <h3>{dest.name}</h3>
                                <p className="inspiration-desc">{dest.description}</p>
                                {dest.region && <span className="inspiration-region">{dest.region}</span>}
                                <div className="inspiration-tags">
                                    {dest.tags?.map((tag) => (
                                        <span key={tag} className="inspiration-tag">#{tag}</span>
                                    ))}
                                </div>
                                <div className="inspiration-eco">
                                    <FaLeaf /> Voyage écolo en train
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
