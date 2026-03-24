import { useState, useEffect } from "react";
import { FaSearch, FaHeart, FaLeaf, FaTrain, FaChair, FaWifi, FaCity, FaClock, FaEuroSign, FaSmile, FaDice, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/index.css";

function Index() {
    const [favoris, setFavoris] = useState(false);
    const [fromCity, setFromCity] = useState("");
    const [toCity, setToCity] = useState("");
    const [travelDate, setTravelDate] = useState("");
    const [suggestionsFrom, setSuggestionsFrom] = useState([]);
    const [suggestionsTo, setSuggestionsTo] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [globalStats, setGlobalStats] = useState(null);
    const [geoLoading, setGeoLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/sncf/destinations")
            .then(({ data }) => setDestinations(data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        api.get("/stats/global")
            .then(({ data }) => setGlobalStats(data))
            .catch(() => {});
    }, []);

    const handleSurpriseMe = () => {
        if (destinations.length === 0) return;
        const dest = destinations[Math.floor(Math.random() * destinations.length)];
        navigate(`/search?from=${encodeURIComponent(fromCity || "Paris")}&to=${encodeURIComponent(dest.name)}`);
    };

    const handleGeolocate = () => {
        if (!navigator.geolocation) return;
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const { data } = await api.get(`/sncf/gare-proche?lat=${latitude}&lon=${longitude}`);
                    if (data.gare) setFromCity(data.gare);
                } catch {}
                setGeoLoading(false);
            },
            () => setGeoLoading(false)
        );
    };

    const handleSearch = () => {
        if (!fromCity || !toCity) return;
        const p = new URLSearchParams({ from: fromCity, to: toCity });
        if (travelDate) p.set("date", travelDate);
        navigate(`/search?${p.toString()}`);
    };

    const handleInputChange = async (value, type) => {
        const setter = type === "from" ? setFromCity : setToCity;
        const suggSetter = type === "from" ? setSuggestionsFrom : setSuggestionsTo;
        setter(value);
        if (!value) { suggSetter([]); return; }
        try {
            const { data } = await api.get(`/sncf/autocomplete?q=${value}`);
            suggSetter(Array.isArray(data) ? data.slice(0, 5) : []);
        } catch { suggSetter([]); }
    };

    const handleSelect = (value, type) => {
        if (type === "from") { setFromCity(value); setSuggestionsFrom([]); }
        else { setToCity(value); setSuggestionsTo([]); }
    };

    const toggleFavoris = () => {
        if (!fromCity || !toCity) return;
        const favs = JSON.parse(localStorage.getItem("trajetFavoris") || "[]");
        const exists = favs.some(f => f.from === fromCity && f.to === toCity);
        if (exists) {
            localStorage.setItem("trajetFavoris", JSON.stringify(favs.filter(f => !(f.from === fromCity && f.to === toCity))));
            setFavoris(false);
        } else {
            favs.push({ id: Date.now(), from: fromCity, to: toCity, date: new Date().toISOString() });
            localStorage.setItem("trajetFavoris", JSON.stringify(favs));
            setFavoris(true);
        }
    };

    useEffect(() => {
        if (fromCity && toCity) {
            const favs = JSON.parse(localStorage.getItem("trajetFavoris") || "[]");
            setFavoris(favs.some(f => f.from === fromCity && f.to === toCity));
        } else {
            setFavoris(false);
        }
    }, [fromCity, toCity]);

    const WHY_ITEMS = [
        { icon: <FaLeaf />, label: "40x moins de CO₂" },
        { icon: <FaTrain />, label: "Pas de bouchons" },
        { icon: <FaChair />, label: "Confort & espace" },
        { icon: <FaWifi />, label: "Wifi & prises" },
        { icon: <FaCity />, label: "Centre-ville" },
        { icon: <FaClock />, label: "Ponctualité" },
        { icon: <FaEuroSign />, label: "Économique" },
        { icon: <FaSmile />, label: "Zéro stress" },
    ];

    return (
        <div className="index-page">

            {/* ── HERO ── */}
            <section className="hero-section">
                <div className="hero-text">
                    <h1 className="hero-title">Votre prochaine escapade en train</h1>
                    <p className="hero-subtitle">Voyagez responsable, découvrez la France autrement</p>
                </div>

                {/* SEARCH CARD */}
                <div className="search-card">
                    {/* Départ */}
                    <div className="search-row">
                        <FaTrain className="search-row-icon" />
                        <div className="input-wrapper">
                            <input
                                type="text"
                                className="search-placeholder"
                                placeholder="Gare de départ"
                                value={fromCity}
                                onChange={(e) => handleInputChange(e.target.value, "from")}
                            />
                            {suggestionsFrom.length > 0 && (
                                <ul className="suggestions">
                                    {suggestionsFrom.map((g, i) => (
                                        <li key={i} onClick={() => handleSelect(g, "from")}>{g}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            className="geo-btn"
                            onClick={handleGeolocate}
                            disabled={geoLoading}
                            title="Gare la plus proche"
                        >
                            <FaMapMarkerAlt />
                        </button>
                    </div>

                    {/* Arrivée */}
                    <div className="search-row">
                        <FaSearch className="search-row-icon" />
                        <div className="input-wrapper">
                            <input
                                type="text"
                                className="search-placeholder"
                                placeholder="Destination"
                                value={toCity}
                                onChange={(e) => handleInputChange(e.target.value, "to")}
                            />
                            {suggestionsTo.length > 0 && (
                                <ul className="suggestions">
                                    {suggestionsTo.map((g, i) => (
                                        <li key={i} onClick={() => handleSelect(g, "to")}>{g}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            className={`fav-btn ${favoris ? "active" : ""}`}
                            onClick={toggleFavoris}
                            title="Mettre en favori"
                        >
                            <FaHeart />
                        </button>
                    </div>

                    {/* Date + Rechercher */}
                    <div className="search-bottom">
                        <input
                            type="date"
                            className="search-date"
                            value={travelDate}
                            onChange={(e) => setTravelDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                        />
                        <button className="search-submit" onClick={handleSearch}>
                            <FaSearch /> Rechercher
                        </button>
                    </div>

                    <button className="surprise-btn" onClick={handleSurpriseMe}>
                        <FaDice /> Surprends-moi !
                    </button>
                </div>
            </section>

            {/* ── STATS ── */}
            {globalStats && (
                <section className="stats-strip">
                    <div className="stat-pill">
                        <div className="stat-pill-val">{Math.round(globalStats.total_co2_economise_kg).toLocaleString("fr-FR")} kg</div>
                        <div className="stat-pill-label">CO₂ économisé</div>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat-pill">
                        <div className="stat-pill-val">{globalStats.arbres_equivalents.toLocaleString("fr-FR")}</div>
                        <div className="stat-pill-label">arbres plantés</div>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat-pill">
                        <div className="stat-pill-val">{globalStats.total_trajets.toLocaleString("fr-FR")}</div>
                        <div className="stat-pill-label">trajets recherchés</div>
                    </div>
                </section>
            )}

            {/* ── DESTINATIONS ── */}
            {destinations.length > 0 && (
                <section className="destinations-section">
                    <h2 className="section-heading">Destinations coup de coeur</h2>
                    <div className="destinations-scroll">
                        {destinations.map((dest) => (
                            <div
                                key={dest.id}
                                className="dest-card"
                                onClick={() => navigate(`/search?from=${encodeURIComponent(fromCity || "Paris")}&to=${encodeURIComponent(dest.name)}`)}
                            >
                                {dest.image ? (
                                    <img
                                        src={dest.image}
                                        alt={dest.name}
                                        className="dest-card-img"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display = "flex";
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="dest-card-no-img"
                                    style={{ display: dest.image ? "none" : "flex" }}
                                >
                                    🚆
                                </div>
                                <div className="dest-card-body">
                                    <div className="dest-card-name">{dest.name}</div>
                                    <div className="dest-card-region">{dest.region}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── POURQUOI LE TRAIN ── */}
            <section className="why-section">
                <h2 className="section-heading">Pourquoi voyager en train ?</h2>
                <div className="why-grid">
                    {WHY_ITEMS.map(({ icon, label }) => (
                        <div key={label} className="why-pill">
                            <span className="why-pill-icon">{icon}</span>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── IMPACT ── */}
            <section className="impact-banner">
                <h3>Votre impact compte</h3>
                <p>
                    Un trajet Paris – Lyon en train plutôt qu'en voiture, c'est{" "}
                    <strong>120 kg de CO₂ économisés</strong> — l'équivalent de{" "}
                    <strong>600 km en voiture</strong> ou <strong>15 jours de chauffage</strong>.
                </p>
            </section>

            {/* ── FOOTER ── */}
            <footer className="index-footer">
                <p>Voyager en train, c'est plus que se déplacer : <strong>c'est agir pour demain.</strong></p>
            </footer>

        </div>
    );
}

export default Index;
