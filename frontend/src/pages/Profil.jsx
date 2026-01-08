import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { FaUser, FaHeart, FaHistory, FaMoon, FaSun, FaSignOutAlt, FaTrain, FaMapMarkerAlt, FaClock, FaLeaf } from "react-icons/fa";
import api from "../api/axios";
import "../styles/profil.css";

function Profil() {
    const navigate = useNavigate();
    const { isAuthenticated, id } = useAuth();
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState("info");
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("darkMode") === "true";
    });

    // Récupérer l'historique et les favoris depuis localStorage
    const [historique, setHistorique] = useState([]);
    const [favoris, setFavoris] = useState([]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        // Récupérer les données de l'utilisateur
        const fetchUserData = async () => {
            try {
                const { data } = await api.get(`/users/${id}`);
                setUserData(data);
            } catch (err) {
                console.error("Erreur lors de la récupération des données utilisateur :", err);
            }
        };

        fetchUserData();

        // Récupérer l'historique depuis localStorage
        const loadedHistorique = JSON.parse(localStorage.getItem('trajetHistorique') || '[]');
        setHistorique(loadedHistorique.slice(0, 5)); // Garder les 5 derniers

        // Récupérer les favoris depuis localStorage
        const loadedFavoris = JSON.parse(localStorage.getItem('trajetFavoris') || '[]');
        setFavoris(loadedFavoris);
    }, [isAuthenticated, navigate, id]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem("darkMode", newMode);
    };

    if (!userData) {
        return <div className="profil-loading">Chargement du profil...</div>;
    }

    return (
        <div className={`profil-page ${darkMode ? "dark" : ""}`}>
            {/* Header avec toggle dark mode */}
            <header className="profil-header">
                <div className="header-content">
                    <h1 className="profil-title">Mon Profil</h1>
                    <div className="header-actions">
                        <button className="theme-toggle" onClick={toggleDarkMode}>
                            {darkMode ? <FaSun /> : <FaMoon />}
                        </button>
                        <button className="logout-btn" onClick={handleLogout}>
                            <FaSignOutAlt /> Déconnexion
                        </button>
                    </div>
                </div>
            </header>

            {/* Carte utilisateur */}
            <section className="user-card">
                <div className="user-avatar">
                    {userData.photo_url ? (
                        <img src={userData.photo_url} alt="Avatar" />
                    ) : (
                        <FaUser />
                    )}
                </div>
                <div className="user-info-header">
                    <h2>{userData.first_name} {userData.last_name}</h2>
                    <p className="user-email">{userData.email}</p>
                </div>
            </section>

            {/* Tabs de navigation */}
            <nav className="profil-tabs">
                <button
                    className={`tab ${activeTab === "info" ? "active" : ""}`}
                    onClick={() => setActiveTab("info")}
                >
                    <FaUser /> Informations
                </button>
                <button
                    className={`tab ${activeTab === "favoris" ? "active" : ""}`}
                    onClick={() => setActiveTab("favoris")}
                >
                    <FaHeart /> Favoris
                </button>
                <button
                    className={`tab ${activeTab === "historique" ? "active" : ""}`}
                    onClick={() => setActiveTab("historique")}
                >
                    <FaHistory /> Historique
                </button>
            </nav>

            {/* Contenu des tabs */}
            <div className="tab-content">
                {/* Informations personnelles */}
                {activeTab === "info" && (
                    <div className="info-section">
                        <h3 className="section-title">Informations personnelles</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Prénom</label>
                                <p>{userData.first_name}</p>
                            </div>
                            <div className="info-item">
                                <label>Nom</label>
                                <p>{userData.last_name}</p>
                            </div>
                            <div className="info-item">
                                <label>Email</label>
                                <p>{userData.email}</p>
                            </div>
                            <div className="info-item">
                                <label>Téléphone</label>
                                <p>{userData.phone || "Non renseigné"}</p>
                            </div>
                            <div className="info-item">
                                <label>Date de naissance</label>
                                <p>{userData.date_of_birth ? new Date(userData.date_of_birth).toLocaleDateString('fr-FR') : "Non renseignée"}</p>
                            </div>
                            <div className="info-item">
                                <label>Adresse</label>
                                <p>{userData.address || "Non renseignée"}</p>
                            </div>
                            <div className="info-item">
                                <label>Code postal</label>
                                <p>{userData.postal_code || "Non renseigné"}</p>
                            </div>
                            <div className="info-item">
                                <label>Ville</label>
                                <p>{userData.city || "Non renseignée"}</p>
                            </div>
                        </div>
                        <button className="edit-profile-btn">Modifier mon profil</button>
                    </div>
                )}

                {/* Trajets favoris */}
                {activeTab === "favoris" && (
                    <div className="favoris-section">
                        <h3 className="section-title">Mes trajets favoris</h3>
                        {favoris.length > 0 ? (
                            <div className="trajets-list">
                                {favoris.map((trajet) => (
                                    <div key={trajet.id} className="trajet-card">
                                        <div className="trajet-route">
                                            <FaTrain className="train-icon" />
                                            <div className="route-info">
                                                <p className="route-cities">
                                                    <span>{trajet.from}</span>
                                                    <FaMapMarkerAlt className="arrow-icon" />
                                                    <span>{trajet.to}</span>
                                                </p>
                                                <p className="route-date">Ajouté le {new Date(trajet.date).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                        </div>
                                        <button className="rechercher-btn" onClick={() => navigate(`/search?from=${trajet.from}&to=${trajet.to}`)}>
                                            Rechercher
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-state">Aucun trajet favori pour le moment</p>
                        )}
                    </div>
                )}

                {/* Historique */}
                {activeTab === "historique" && (
                    <div className="historique-section">
                        <h3 className="section-title">Mes 5 derniers trajets</h3>
                        {historique.length > 0 ? (
                            <div className="trajets-list">
                                {historique.map((trajet) => (
                                    <div key={trajet.id} className="trajet-card history">
                                        <div className="trajet-header">
                                            <div className="trajet-route">
                                                <FaTrain className="train-icon" />
                                                <div className="route-info">
                                                    <p className="route-cities">
                                                        <span>{trajet.from}</span>
                                                        <FaMapMarkerAlt className="arrow-icon" />
                                                        <span>{trajet.to}</span>
                                                    </p>
                                                    <p className="route-date">{new Date(trajet.date).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="trajet-details">
                                            <div className="detail-item">
                                                <FaClock />
                                                <span className="detail-label">Temps: </span>
                                                <span className="detail-value">{trajet.duration}</span>
                                            </div>
                                            <div className="detail-item eco">
                                                <FaLeaf />
                                                <span className="detail-label">CO² éco.: </span>
                                                <span className="detail-value">{trajet.co2Saved}</span>
                                            </div>
                                            <div className="detail-item price">
                                                <span>{trajet.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-state">Aucun trajet dans l'historique</p>
                        )}
                    </div>
                )}
            </div>

            {/* Stats rapides */}
            <section className="stats-section">
                <h3 className="section-title">Mes statistiques</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon eco">
                            <FaLeaf />
                        </div>
                        <div className="stat-content">
                            <p className="stat-value">
                                {historique.reduce((total, trajet) => {
                                    const co2 = parseFloat(trajet.co2Saved) || 0;
                                    return total + co2;
                                }, 0).toFixed(1)} kg
                            </p>
                            <p className="stat-label">CO₂ économisé</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon train">
                            <FaTrain />
                        </div>
                        <div className="stat-content">
                            <p className="stat-value">{historique.length}</p>
                            <p className="stat-label">Trajets recherchés</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon time">
                            <FaClock />
                        </div>
                        <div className="stat-content">
                            <p className="stat-value">
                                {(() => {
                                    const totalMinutes = historique.reduce((total, trajet) => {
                                        // Parser "2h05" -> 125 minutes
                                        const match = trajet.duration.match(/(\d+)h(\d+)/);
                                        if (match) {
                                            return total + parseInt(match[1]) * 60 + parseInt(match[2]);
                                        }
                                        return total;
                                    }, 0);
                                    const hours = Math.floor(totalMinutes / 60);
                                    const minutes = totalMinutes % 60;
                                    return `${hours}h${minutes.toString().padStart(2, '0')}`;
                                })()}
                            </p>
                            <p className="stat-label">Temps de voyage</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Profil;