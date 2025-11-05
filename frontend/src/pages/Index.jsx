import { useState, useEffect } from "react";
import { FaSearch, FaHeart, FaLeaf, FaTrain, FaChair, FaWifi, FaCity } from "react-icons/fa";
import train from "../assets/train-removebg-preview.png";
import coteAzur from "../assets/cote-azur.png";
import annecy from "../assets/annecy.png"
import "../styles/index.css";

function Index() {
    const [favoris, setFavoris] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);

    const slides = [
        {
            image: annecy,
            text: "Cap sur Annecy entre lac et montagnes",
        },
        {
            image: coteAzur,
            text: "La Côte d’Azur sans voiture",
        },
    ];

    // Carrousel (change toutes les 4 secondes)
    useEffect(() => {
        const interval = setInterval(() => {
            setSlideIndex((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="index-page">
            {/* Barre de recherche */}
            <section className="search-section">
                <div className="search-bar">
                    <input type="text" className="search-placeholder" placeholder="Gare de départ"/>
                    <input type="text" className="search-placeholder" placeholder="Gare d'arrivée"/>
                    <input type="date"/>
                    <button className="search-btn">
                        <FaSearch/>
                    </button>
                </div>
            </section>
            <div>
                <p className="favoris-text" onClick={() => setFavoris(!favoris)}>
                    <FaHeart className={favoris ? "favoris active" : "favoris"}/> Mettre ce trajet en favoris
                </p>
            </div>

            {/* Card train */}
            <section className="card-train-main">
                <div className="card-train">
                    <p className="card-train-title">
                        Un trajet Paris - Lyon en train émet 20 kg de CO₂ de moins
                        qu’en voiture.
                    </p>
                </div>
            </section>

            {/* Carrousel */}
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

            {/* Pourquoi choisir le train */}
            <section className="reasons-section">
                <h2 className="reasons-section-title">Pourquoi choisir le train ?</h2>

                <div className="reasons-grid">
                    <div className="reason"><FaLeaf/> 40x moins de CO₂</div>
                    <div className="reason"><FaTrain/> Pas de bouchons</div>
                    <div className="reason"><FaChair/> Confort & espace</div>
                    <div className="reason"><FaWifi/> Wifi & prises</div>
                    <div className="reason"><FaCity/> Gare en centre-ville</div>
                </div>
            </section>

            <footer className="index-footer">
                Voyager en train, c’est plus que se déplacer : <strong>c’est agir.</strong>
            </footer>
        </div>
    );
}

export default Index;
