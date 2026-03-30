import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaTrain, FaLeaf, FaMapMarkedAlt } from "react-icons/fa";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
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

const COLOR_MAP = { green: "#2D5443", orange: "#E8A020", red: "#A6706A" };

function FitBounds({ stations }) {
    const map = useMap();
    useEffect(() => {
        if (!stations || stations.length === 0) return;
        const bounds = stations.map(s => [s.lat, s.lon]);
        map.fitBounds(bounds, { padding: [30, 30] });
    }, [stations, map]);
    return null;
}

export default function Inspiration() {
    const navigate = useNavigate();
    const [destinations, setDestinations] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [activeTag, setActiveTag] = useState("all");
    const [fromCity, setFromCity] = useState("Paris");
    const [loading, setLoading] = useState(true);

    const [reachDuration, setReachDuration] = useState(7200);
    const [reachStations, setReachStations] = useState(null);
    const [reachLoading, setReachLoading] = useState(false);
    const [reachError, setReachError] = useState("");
    const [reachSuggestions, setReachSuggestions] = useState([]);

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

    const handleReachInput = async (value) => {
        setFromCity(value);
        setReachStations(null);
        if (!value || value.length < 2) { setReachSuggestions([]); return; }
        try {
            const { data } = await api.get(`/sncf/autocomplete?q=${value}`);
            setReachSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
        } catch { setReachSuggestions([]); }
    };

    const handleReachSelect = (name) => {
        setFromCity(name);
        setReachSuggestions([]);
    };

    const fetchReachable = () => {
        if (!fromCity.trim()) return;
        setReachSuggestions([]);
        setReachLoading(true);
        setReachError("");
        setReachStations(null);
        api.get("/sncf/reachable", { params: { from_city: fromCity, max_duration: reachDuration } })
            .then(({ data }) => {
                if (data.stations && data.stations.length > 0) setReachStations(data.stations);
                else setReachError("Aucune destination trouvée. Vérifiez le nom de la gare.");
            })
            .catch(() => setReachError("Erreur lors du calcul. Vérifiez le nom de la gare."))
            .finally(() => setReachLoading(false));
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

            {/* ── JUSQU'OÙ PUIS-JE ALLER ── */}
            <section className="isochrone-section">
                <h2 className="isochrone-title"><FaMapMarkedAlt /> Jusqu'où puis-je aller ?</h2>
                <div className="isochrone-controls">
                    <div className="isochrone-input-wrapper">
                        <input
                            className="isochrone-input"
                            value={fromCity}
                            onChange={(e) => handleReachInput(e.target.value)}
                            placeholder="Gare de départ"
                            autoComplete="off"
                        />
                        {reachSuggestions.length > 0 && (
                            <ul className="isochrone-suggestions">
                                {reachSuggestions.map((s, i) => (
                                    <li key={i} onClick={() => handleReachSelect(s)}>{s}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="isochrone-durations">
                        {[3600, 7200, 10800].map(d => (
                            <button
                                key={d}
                                className={`isochrone-dur-btn ${reachDuration === d ? "active" : ""}`}
                                onClick={() => setReachDuration(d)}
                            >
                                {d / 3600}h
                            </button>
                        ))}
                    </div>
                    <button className="isochrone-go-btn" onClick={fetchReachable} disabled={reachLoading}>
                        {reachLoading ? "Calcul…" : "Voir les gares"}
                    </button>
                </div>

                {reachError && <p className="isochrone-error">{reachError}</p>}

                {reachStations && (
                    <>
                        <div className="isochrone-legend-row">
                            <span className="isochrone-dot" style={{ background: COLOR_MAP.green }} /> &lt; 1h
                            <span className="isochrone-dot" style={{ background: COLOR_MAP.orange }} /> 1h – 2h
                            <span className="isochrone-dot" style={{ background: COLOR_MAP.red }} /> 2h – {reachDuration / 3600}h
                            <span className="isochrone-count">{reachStations.length} gares</span>
                        </div>
                        <div className="isochrone-map">
                            <MapContainer
                                center={[46.5, 2.5]}
                                zoom={5}
                                style={{ height: "400px", width: "100%" }}
                                scrollWheelZoom={false}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <FitBounds stations={reachStations} />
                                {reachStations.map((s, i) => (
                                    <CircleMarker
                                        key={i}
                                        center={[s.lat, s.lon]}
                                        radius={5}
                                        pathOptions={{
                                            color: COLOR_MAP[s.color],
                                            fillColor: COLOR_MAP[s.color],
                                            fillOpacity: 0.8,
                                            weight: 1,
                                        }}
                                    >
                                        <Popup>
                                            <strong>{s.name}</strong><br />
                                            ~{s.duree_min} min · {s.distance_km} km
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        </div>
                    </>
                )}
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
