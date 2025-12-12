import { useState, useEffect } from "react";
import { FaSearch, FaHeart, FaLeaf, FaTrain, FaChair, FaWifi, FaCity } from "react-icons/fa";
import coteAzur from "../assets/cote-azur.png";
import annecy from "../assets/annecy.png";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/index.css";

function Index() {
    const [favoris, setFavoris] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);
    const [fromCity, setFromCity] = useState("");
    const [toCity, setToCity] = useState("");
    const [gares, setGares] = useState([]);
    const [suggestionsFrom, setSuggestionsFrom] = useState([]);
    const [suggestionsTo, setSuggestionsTo] = useState([]);
    const navigate = useNavigate();

    const slides = [
        { image: annecy, text: "Cap sur Annecy entre lac et montagnes" },
        { image: coteAzur, text: "La Côte d’Azur sans voiture" },
    ];

    // Carrousel (change toutes les 4 secondes)
    useEffect(() => {
        const interval = setInterval(() => {
            setSlideIndex((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [slides.length]);

    // 🔍 Recherche
    const handleSearch = () => {
        if (!fromCity || !toCity) return;
        navigate(`/search?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`);
    };

    // Suggestions dynamiques (max 5 résultats)
    const handleInputChange = async (value, type) => {
        if (!value) {
            if (type === "from") {
                setFromCity("");
                setSuggestionsFrom([]);
            } else {
                setToCity("");
                setSuggestionsTo([]);
            }
            return;
        }

        try {
            const res = await api.get(`/sncf/autocomplete?q=${value}`);
            // L'API retourne directement un tableau de gares
            const filtered = Array.isArray(res.data) ? res.data.slice(0, 5) : [];

            if (type === "from") {
                setFromCity(value);
                setSuggestionsFrom(filtered);
            } else {
                setToCity(value);
                setSuggestionsTo(filtered);
            }
        } catch (err) {
            console.error("Erreur autocomplétion :", err);
        }
    };

    const handleSelect = (value, type) => {
        if (type === "from") {
            setFromCity(value);
            setSuggestionsFrom([]);
        } else {
            setToCity(value);
            setSuggestionsTo([]);
        }
    };

    return (
        <div className="index-page">
            {/* 🧭 Barre de recherche */}
            <section className="search-section">
                <div className="search-bar">
                    {/* Départ */}
                    <div className="input-wrapper">
                        <input
                            type="text"
                            className="search-placeholder"
                            placeholder="Départ"
                            value={fromCity}
                            onChange={(e) => handleInputChange(e.target.value, "from")}
                        />
                        {suggestionsFrom.length > 0 && (
                            <ul className="suggestions">
                                {suggestionsFrom.map((gare, i) => (
                                    <li key={i} onClick={() => handleSelect(gare, "from")}>
                                        {gare}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Arrivée */}
                    <div className="input-wrapper">
                        <input
                            type="text"
                            className="search-placeholder"
                            placeholder="Arrivée"
                            value={toCity}
                            onChange={(e) => handleInputChange(e.target.value, "to")}
                        />
                        {suggestionsTo.length > 0 && (
                            <ul className="suggestions">
                                {suggestionsTo.map((gare, i) => (
                                    <li key={i} onClick={() => handleSelect(gare, "to")}>
                                        {gare}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <input type="date" />
                    <button className="search-btn" onClick={handleSearch}>
                        <FaSearch />
                    </button>
                </div>
            </section>

            {/* ❤️ Favoris */}
            <p className="favoris-text" onClick={() => setFavoris(!favoris)}>
                <FaHeart className={favoris ? "favoris active" : "favoris"} /> Mettre ce trajet en favoris
            </p>

            {/* 🚆 Card train */}
            <section className="card-train-main">
                <div className="card-train">
                    <p className="card-train-title">
                        Un trajet Paris - Lyon en train émet 20 kg de CO₂ de moins qu’en voiture.
                    </p>
                </div>
            </section>

            {/* 🖼️ Carrousel */}
            <section className="carousel">
                <div className="carousel-slide">
                    <img
                        src={slides[slideIndex].image}
                        alt={`slide-${slideIndex}`}
                        className="carousel-img"
                    />
                    <p className="carousel-text">{slides[slideIndex].text}</p>
                </div>

                <div className="carousel-dots">
                    {slides.map((_, i) => (
                        <span
                            key={i}
                            className={`dot ${i === slideIndex ? "active" : ""}`}
                            onClick={() => setSlideIndex(i)}
                        ></span>
                    ))}
                </div>
            </section>

            {/* 🌍 Pourquoi choisir le train */}
            <section className="reasons-section">
                <h2 className="reasons-section-title">Pourquoi choisir le train ?</h2>
                <div className="reasons-grid">
                    <div className="reason"><FaLeaf /> 40x moins de CO₂</div>
                    <div className="reason"><FaTrain /> Pas de bouchons</div>
                    <div className="reason"><FaChair /> Confort & espace</div>
                    <div className="reason"><FaWifi /> Wifi & prises</div>
                    <div className="reason"><FaCity /> Gare en centre-ville</div>
                </div>
            </section>

            <footer className="index-footer">
                Voyager en train, c’est plus que se déplacer : <strong>c’est agir.</strong>
            </footer>
        </div>
    );
}

export default Index;
