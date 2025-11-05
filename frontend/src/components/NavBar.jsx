import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaUser, FaSignOutAlt, FaSignInAlt } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import AuthModal from "./AuthModal";
import "../styles/navBar.css";
import logoSansTrain from "../assets/logo_sans_train-removebg-preview.png";

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
                        src={logoSansTrain}
                        alt="Logo GoÉco"
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
                    Explore la France autrement, plus vert, plus responsable.
                </p>
            </nav>

            {/* Modal de connexion / inscription */}
            <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}/>
        </>
    );
};

export default NavBar;
