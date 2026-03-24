import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaTrain, FaLeaf } from "react-icons/fa";
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
    const [budgetMax, setBudgetMax] = useState("");
    const [fromCity, setFromCity] = useState("Paris");
    const [loading, setLoading] = useState(true);

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
