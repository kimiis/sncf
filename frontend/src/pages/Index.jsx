import { useState, useEffect } from "react";
import { FaSearch, FaHeart, FaLeaf, FaTrain, FaChair, FaWifi, FaCity, FaClock, FaEuroSign, FaSmile } from "react-icons/fa";
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
    const [suggestionsFrom, setSuggestionsFrom] = useState([]);
    const [suggestionsTo, setSuggestionsTo] = useState([]);
    const navigate = useNavigate();

    const slides = [
        { image: annecy, text: "Cap sur Annecy entre lac et montagnes" },
        { image: coteAzur, text: "La Côte d'Azur sans voiture" },
    ];

    // Carrousel (change toutes les 4 secondes)
    useEffect(() => {
        const interval = setInterval(() => {
            setSlideIndex((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [slides.length]);

    // Recherche
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
            {/* Hero Section */}
            <section className="hero-section">
                <h1 className="hero-title">Voyagez autrement, voyagez mieux</h1>
                <p className="hero-subtitle">Découvrez la France en train tout en préservant la planète</p>
            </section>

            {/* Barre de recherche */}
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

            {/* Favoris */}
            <p className="favoris-text" onClick={() => setFavoris(!favoris)}>
                <FaHeart className={favoris ? "favoris active" : "favoris"} /> Mettre ce trajet en favoris
            </p>

            {/* Section comparaison Train vs Voiture */}
            <section className="comparison-section">
                <h2 className="section-title">Train vs Voiture : Les chiffres parlent</h2>
                <div className="comparison-cards">
                    <div className="comparison-card eco">
                        <div className="comparison-icon">
                            <FaLeaf />
                        </div>
                        <h3>40x moins de CO₂</h3>
                        <p className="comparison-stat">1,9 kg CO₂</p>
                        <p className="comparison-label">vs 122 kg en voiture</p>
                        <p className="comparison-detail">pour 100 km par personne</p>
                    </div>

                    <div className="comparison-card time">
                        <div className="comparison-icon">
                            <FaClock />
                        </div>
                        <h3>Temps utile</h3>
                        <p className="comparison-stat">100%</p>
                        <p className="comparison-label">productif ou reposant</p>
                        <p className="comparison-detail">Travaillez, lisez ou dormez</p>
                    </div>

                    <div className="comparison-card money">
                        <div className="comparison-icon">
                            <FaEuroSign />
                        </div>
                        <h3>Economique</h3>
                        <p className="comparison-stat">-50%</p>
                        <p className="comparison-label">de frais en moyenne</p>
                        <p className="comparison-detail">Péage + essence + parking</p>
                    </div>

                    <div className="comparison-card stress">
                        <div className="comparison-icon">
                            <FaSmile />
                        </div>
                        <h3>Zéro stress</h3>
                        <p className="comparison-stat">0</p>
                        <p className="comparison-label">embouteillage</p>
                        <p className="comparison-detail">Arrivée garantie à l'heure</p>
                    </div>
                </div>
            </section>

            {/* Impact card */}
            <section className="impact-section">
                <div className="impact-card">
                    <div className="impact-content">
                        <h3 className="impact-title">Votre impact compte</h3>
                        <p className="impact-text">
                            Un trajet Paris - Lyon en train plutôt qu'en voiture, c'est <strong>120 kg de CO₂ économisés</strong>.
                            L'équivalent de <strong>600 km parcourus en voiture</strong> ou <strong>15 jours de chauffage</strong> pour un appartement.
                        </p>
                    </div>
                </div>
            </section>

            {/* Carrousel */}
            <section className="carousel">
                <h2 className="section-title">Destinations coup de cœur</h2>
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

            {/* Pourquoi choisir le train */}
            <section className="reasons-section">
                <h2 className="section-title">Les avantages du train</h2>
                <div className="reasons-grid">
                    <div className="reason">
                        <FaLeaf className="reason-icon" />
                        <span className="reason-text">Eco-responsable</span>
                    </div>
                    <div className="reason">
                        <FaTrain className="reason-text" />
                        <span className="reason-text">Pas de bouchons</span>
                    </div>
                    <div className="reason">
                        <FaChair className="reason-icon" />
                        <span className="reason-text">Confort & espace</span>
                    </div>
                    <div className="reason">
                        <FaWifi className="reason-icon" />
                        <span className="reason-text">Wifi & prises</span>
                    </div>
                    <div className="reason">
                        <FaCity className="reason-icon" />
                        <span className="reason-text">Gare en centre-ville</span>
                    </div>
                    <div className="reason">
                        <FaClock className="reason-icon" />
                        <span className="reason-text">Ponctualité</span>
                    </div>
                </div>
            </section>

            <footer className="index-footer">
                <p className="footer-main">Voyager en train, c'est plus que se déplacer : <strong>c'est agir pour demain.</strong></p>
                <p className="footer-stat">🌱 Chaque année, le train évite l'émission de 3 millions de tonnes de CO₂ en France</p>
            </footer>
        </div>
    );
}

export default Index;