import { useState } from "react";
import api from "../api/axios";
import montagnes from "../assets/montagnes-ss-bg.png";
import "../styles/authModal.css";

const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        civilite: "",
        first_name: "",
        last_name: "",
        date_of_birth: "",
        email: "",
        password: "",
        phone: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isLogin) {
                // --- 🔐 Connexion ---
                const response = await api.post("/auth/login", {
                    email: formData.email,
                    password: formData.password,
                });

                // Stocker le token et fermer la modal
                localStorage.setItem("token", response.data.token);
                alert("Connexion réussie !");
                onClose();

            } else {
                // --- 🧾 Inscription ---
                const token = localStorage.getItem("token");
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

                await api.post("/users", formData, config);

                alert("Utilisateur créé avec succès !");
                setIsLogin(true); // revenir sur le mode login
            }
        } catch (error) {
            console.error("Erreur :", error);
            alert(error?.response?.data?.message || "Une erreur est survenue.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div
                className="auth-modal"
                style={{ height: isLogin ? "400px" : "600px" }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2>{isLogin ? "Se connecter" : "Inscription"}</h2>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <input type="text" name="civilite" placeholder="Civilité" onChange={handleChange}/>
                            <input type="text" name="last_name" placeholder="Nom" onChange={handleChange} required/>
                            <input type="text" name="first_name" placeholder="Prénom" onChange={handleChange} required/>
                            <input type="date" name="date_of_birth" onChange={handleChange} required/>
                            <input type="text" name="phone" placeholder="Téléphone" onChange={handleChange}/>
                        </>
                    )}

                    <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                    <input type="password" name="password" placeholder="Mot de passe" onChange={handleChange} required />

                    <button type="submit" className="auth-btn">
                        {isLogin ? "Se connecter" : "S'inscrire"}
                    </button>
                </form>

                <p className="switch-mode">
                    {isLogin ? (
                        <>
                            Pas de compte ?{" "}
                            <button type="button" onClick={() => setIsLogin(false)} className="switch-link">
                                S'inscrire
                            </button>
                        </>
                    ) : (
                        <>
                            Déjà un compte ?{" "}
                            <button type="button" onClick={() => setIsLogin(true)} className="switch-link">
                                Se connecter
                            </button>
                        </>
                    )}
                </p>

                <img src={montagnes} alt="Montagnes décoratives" className="auth-montagnes" draggable="false" />
            </div>
        </div>
    );
};

export default AuthModal;
