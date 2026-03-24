import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaUser, FaSignOutAlt, FaSignInAlt, FaCompass } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import AuthModal from "./AuthModal";
import "../styles/navBar.css";
import railgoLogo from "../assets/railgo_logo.svg";

const NavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem("token");
    const [isModalOpen, setIsModalOpen] = useState(false);

    let role = null;
    if (token) {
        try {
            role = jwtDecode(token).role;
        } catch {
            role = null;
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };

    return (
        <>
            <nav className="navbar">
                {/* === LOGO À GAUCHE === */}
                <div className="navbar-left" onClick={() => navigate("/index")}>
                    <img
                        src={railgoLogo}
                        alt="Logo RailGo"
                        className="navbar-logo"
                    />
                </div>

                {/* === ICÔNES À DROITE === */}
                <div className="navbar-right">
                    <button
                        onClick={() => navigate("/index")}
                        className={`navItem ${location.pathname === "/index" ? "active" : ""}`}
                        aria-label="Accueil"
                    >
                        <FaHome className="icon"/>
                    </button>
                    <button
                        onClick={() => navigate("/inspiration")}
                        className={`navItem ${location.pathname === "/inspiration" ? "active" : ""}`}
                        aria-label="Inspiration"
                    >
                        <FaCompass className="icon"/>
                    </button>

                    {!token ? (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="navItem"
                            aria-label="Connexion"
                        >
                            <FaSignInAlt className="icon"/>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate("/profil")}
                                className={`navItem ${location.pathname === "/profil" ? "active" : ""}`}
                                aria-label="Profil"
                            >
                                <FaUser className="icon"/>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="navItem"
                                aria-label="Déconnexion"
                            >
                                <FaSignOutAlt className="icon"/>
                            </button>
                        </>
                    )}
                </div>
                <p className="nav-slogan">
                    Voyage en train, voyage responsable.
                </p>
            </nav>

            {/* Modal de connexion / inscription */}
            <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}/>
        </>
    );
};

export default NavBar;
