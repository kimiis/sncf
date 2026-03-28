import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { LuUser, LuHeart, LuHistory, LuMoon, LuSun, LuLogOut, LuTrain, LuArrowRight, LuClock, LuLeaf, LuPencil, LuX, LuTrophy, LuSprout, LuTreePine, LuStar, LuLock, LuGlobe, LuCar } from "react-icons/lu";
import api from "../api/axios";
import "../styles/profil.css";

function Profil() {
    const navigate = useNavigate();
    const { isAuthenticated, id } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState("info");
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    const [historique, setHistorique] = useState([]);
    const [historiqueComplet, setHistoriqueComplet] = useState([]);
    const [favoris, setFavoris] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [defiProgress, setDefiProgress] = useState(0);
    const DEFI_OBJECTIF = 50; // kg CO2 à économiser cette semaine

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

        // Historique depuis BDD, fallback localStorage
        const fetchHistory = async () => {
            try {
                const { data } = await api.get("/trajet/history");
                const mapped = data.map((h) => {
                    let extra = {};
                    try { extra = JSON.parse(h.type_train || "{}"); } catch {}
                    return {
                        id: h.search_history_id,
                        from: h.gare_depart,
                        to: h.gare_arrivee,
                        date: h.created_at,
                        duration: extra.duree || "N/A",
                        co2Saved: extra.co2_economise || "N/A",
                        price: extra.prix || "N/A",
                    };
                });
                setHistoriqueComplet(mapped);
                setHistorique(mapped.slice(0, 5));
            } catch {
                const local = JSON.parse(localStorage.getItem("trajetHistorique") || "[]");
                setHistoriqueComplet(local);
                setHistorique(local.slice(0, 5));
            }
        };

        // Favoris depuis BDD, fallback localStorage
        const fetchFavorites = async () => {
            try {
                const { data } = await api.get("/trajet/favorites");
                setFavoris(data.map((f) => ({
                    id: f.favorites_itinary_id,
                    from: f.gare_depart,
                    to: f.gare_arrivee,
                    date: f.created_at,
                })));
            } catch {
                const local = JSON.parse(localStorage.getItem("trajetFavoris") || "[]");
                setFavoris(local);
            }
        };

        fetchHistory();
        fetchFavorites();

        // Leaderboard
        api.get("/stats/leaderboard").then(({ data }) => setLeaderboard(data)).catch(() => {});
    }, [isAuthenticated, navigate, id]);

    // Calcul défi hebdo (trajets de la semaine courante)
    useEffect(() => {
        if (!historiqueComplet.length) return;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekly = historiqueComplet.filter((h) => new Date(h.date) > oneWeekAgo);
        const weekCo2 = weekly.reduce((t, h) => t + (parseFloat(h.co2Saved) || 0), 0);
        setDefiProgress(Math.min(weekCo2, DEFI_OBJECTIF));
    }, [historiqueComplet]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const openEdit = () => {
        setEditForm({
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            phone: userData.phone || "",
            address: userData.address || "",
            postal_code: userData.postal_code || "",
            city: userData.city || "",
        });
        setEditOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const { data } = await api.patch(`/users/user/${id}`, editForm);
            setUserData((prev) => ({ ...prev, ...data }));
            setEditOpen(false);
        } catch (err) {
            console.error("Erreur modification profil:", err);
        } finally {
            setEditLoading(false);
        }
    };

    const handleRemoveFavori = async (favId) => {
        try {
            await api.delete(`/trajet/favorites/${favId}`);
            setFavoris((prev) => prev.filter((f) => f.id !== favId));
        } catch {
            setFavoris((prev) => prev.filter((f) => f.id !== favId));
        }
    };

    if (!userData) {
        return <div className="profil-loading">Chargement du profil...</div>;
    }

    const totalCo2 = historiqueComplet.reduce((t, h) => t + (parseFloat(h.co2Saved) || 0), 0);
    const nbTrajets = historiqueComplet.length;

    const BADGES = [
        { id: "first", Icon: LuSprout, label: "Première graine", desc: "1er trajet recherché", unlocked: nbTrajets >= 1 },
        { id: "eco5", Icon: LuLeaf, label: "Éco-voyageur", desc: "5 trajets recherchés", unlocked: nbTrajets >= 5 },
        { id: "co2_50", Icon: LuTreePine, label: "Champion vert", desc: "50 kg CO₂ économisés", unlocked: totalCo2 >= 50 },
        { id: "co2_100", Icon: LuTrophy, label: "Ambassadeur", desc: "100 kg CO₂ économisés", unlocked: totalCo2 >= 100 },
        { id: "traj10", Icon: LuTrain, label: "Grand voyageur", desc: "10 trajets recherchés", unlocked: nbTrajets >= 10 },
        { id: "traj20", Icon: LuStar, label: "Explorateur", desc: "20 trajets recherchés", unlocked: nbTrajets >= 20 },
    ];

    return (
        <div className={`profil-page ${darkMode ? "dark" : ""}`}>
            {/* Header avec toggle dark mode */}
            <header className="profil-header">
                <div className="header-content">
                    <h1 className="profil-title">Mon Profil</h1>
                    <div className="header-actions">
                        <button className="theme-toggle" onClick={toggleDarkMode}>
                            {darkMode ? <LuSun /> : <LuMoon />}
                        </button>
                        <button className="logout-btn" onClick={handleLogout}>
                            <LuLogOut /> Déconnexion
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
                        <LuUser />
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
                    <LuUser /> Informations
                </button>
                <button
                    className={`tab ${activeTab === "favoris" ? "active" : ""}`}
                    onClick={() => setActiveTab("favoris")}
                >
                    <LuHeart /> Favoris
                </button>
                <button
                    className={`tab ${activeTab === "historique" ? "active" : ""}`}
                    onClick={() => setActiveTab("historique")}
                >
                    <LuHistory /> Historique
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
                        <button className="edit-profile-btn" onClick={openEdit}>
                            <LuPencil /> Modifier mon profil
                        </button>
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
                                            <LuTrain className="train-icon" />
                                            <div className="route-info">
                                                <p className="route-cities">
                                                    <span>{trajet.from}</span>
                                                    <LuArrowRight className="arrow-icon" />
                                                    <span>{trajet.to}</span>
                                                </p>
                                                <p className="route-date">Ajouté le {new Date(trajet.date).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button className="rechercher-btn" onClick={() => navigate(`/search?from=${trajet.from}&to=${trajet.to}`)}>
                                                Rechercher
                                            </button>
                                            <button className="remove-favori-btn" onClick={() => handleRemoveFavori(trajet.id)} title="Supprimer">
                                                <LuX />
                                            </button>
                                        </div>
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
                                                <LuTrain className="train-icon" />
                                                <div className="route-info">
                                                    <p className="route-cities">
                                                        <span>{trajet.from}</span>
                                                        <LuArrowRight className="arrow-icon" />
                                                        <span>{trajet.to}</span>
                                                    </p>
                                                    <p className="route-date">{new Date(trajet.date).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="trajet-details">
                                            <div className="detail-item">
                                                <LuClock />
                                                <span className="detail-label">Temps: </span>
                                                <span className="detail-value">{trajet.duration}</span>
                                            </div>
                                            <div className="detail-item eco">
                                                <LuLeaf />
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

            {/* Modale modification profil */}
            {editOpen && (
                <div className="modal-overlay" onClick={() => setEditOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Modifier mon profil</h3>
                            <button className="modal-close" onClick={() => setEditOpen(false)}><LuX /></button>
                        </div>
                        <form className="edit-form" onSubmit={handleEditSubmit}>
                            <div className="edit-form-grid">
                                <div className="form-group">
                                    <label>Prénom</label>
                                    <input value={editForm.first_name} onChange={(e) => setEditForm(p => ({ ...p, first_name: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>Nom</label>
                                    <input value={editForm.last_name} onChange={(e) => setEditForm(p => ({ ...p, last_name: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>Téléphone</label>
                                    <input value={editForm.phone} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>Adresse</label>
                                    <input value={editForm.address} onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>Code postal</label>
                                    <input value={editForm.postal_code} onChange={(e) => setEditForm(p => ({ ...p, postal_code: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>Ville</label>
                                    <input value={editForm.city} onChange={(e) => setEditForm(p => ({ ...p, city: e.target.value }))} />
                                </div>
                            </div>
                            <button type="submit" className="edit-profile-btn" disabled={editLoading}>
                                {editLoading ? "Enregistrement..." : "Enregistrer"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Stats rapides */}
            <section className="stats-section">
                <h3 className="section-title">Mes statistiques</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon eco">
                            <LuLeaf />
                        </div>
                        <div className="stat-content">
                            <p className="stat-value">
                                {historiqueComplet.reduce((total, trajet) => {
                                    const co2 = parseFloat(trajet.co2Saved) || 0;
                                    return total + co2;
                                }, 0).toFixed(1)} kg
                            </p>
                            <p className="stat-label">CO₂ économisé</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon train">
                            <LuTrain />
                        </div>
                        <div className="stat-content">
                            <p className="stat-value">{historiqueComplet.length}</p>
                            <p className="stat-label">Trajets recherchés</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon time">
                            <LuClock />
                        </div>
                        <div className="stat-content">
                            <p className="stat-value">
                                {(() => {
                                    const totalMinutes = historiqueComplet.reduce((total, trajet) => {
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

            {/* Badges */}
            <section className="badges-section">
                <h3 className="section-title">Mes badges</h3>
                <div className="badges-grid">
                    {BADGES.map((badge) => (
                        <div key={badge.id} className={`badge-card ${badge.unlocked ? "unlocked" : "locked"}`}>
                            <span className="badge-icon"><badge.Icon size={28} /></span>
                            <p className="badge-label">{badge.label}</p>
                            <p className="badge-desc">{badge.desc}</p>
                            {!badge.unlocked && <span className="badge-lock"><LuLock size={14} /></span>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Défi hebdomadaire */}
            <section className="defi-section">
                <h3 className="section-title">Défi de la semaine</h3>
                <div className="defi-card">
                    <p className="defi-title">Économise <strong>{DEFI_OBJECTIF} kg de CO₂</strong> cette semaine en prenant le train</p>
                    <div className="defi-bar-track">
                        <div
                            className="defi-bar-fill"
                            style={{ width: `${Math.min((defiProgress / DEFI_OBJECTIF) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="defi-progress">
                        {defiProgress.toFixed(1)} / {DEFI_OBJECTIF} kg
                        {defiProgress >= DEFI_OBJECTIF && " 🎉 Objectif atteint !"}
                    </p>
                </div>
            </section>

            {/* Dashboard CO2 mensuel */}
            {historiqueComplet.length > 0 && (
                <section className="co2-dashboard">
                    <h3 className="section-title">Mon impact CO₂</h3>
                    <div className="co2-impact-cards">
                        <div className="co2-impact-card">
                            <span className="co2-impact-icon"><LuGlobe size={28} /></span>
                            <span className="co2-impact-val">{totalCo2.toFixed(1)} kg</span>
                            <span className="co2-impact-label">CO₂ économisé au total</span>
                        </div>
                        <div className="co2-impact-card">
                            <span className="co2-impact-icon"><LuTreePine size={28} /></span>
                            <span className="co2-impact-val">{Math.round(totalCo2 / 21)}</span>
                            <span className="co2-impact-label">arbres équivalents</span>
                        </div>
                        <div className="co2-impact-card">
                            <span className="co2-impact-icon"><LuCar size={28} /></span>
                            <span className="co2-impact-val">{Math.round(totalCo2 / 0.122)} km</span>
                            <span className="co2-impact-label">km de voiture évités</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
                <section className="leaderboard-section">
                    <h3 className="section-title"><LuTrophy /> Classement communauté</h3>
                    <div className="leaderboard-list">
                        {leaderboard.map((user) => (
                            <div key={user.rank} className={`leaderboard-row ${user.rank <= 3 ? "top3" : ""}`}>
                                <span className="lb-rank">
                                    {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : `#${user.rank}`}
                                </span>
                                <span className="lb-name">{user.nom}</span>
                                <span className="lb-co2">{user.co2_economise_kg} kg <LuLeaf className="leaf-icon" /></span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default Profil;