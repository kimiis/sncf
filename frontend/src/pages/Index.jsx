import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Index() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [clients, setClients] = useState([]);
    const [error, setError] = useState("");

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        try {
            const res = await api.get(`/users/clients?search=${encodeURIComponent(searchTerm)}`);
            if (res.data.length > 0) {
                setClients(res.data);
                setError("");
            } else {
                setClients([]);
                setError("Aucun client trouvé.");
            }
        } catch (err) {
            console.error(err);
            setError("Erreur serveur.");
        }
    };

    return (
        <div className="home-page">
            <h1>Bienvenue sur la page d'accueil !</h1>

            <div className="search-bar">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un client..."
                />
                <button onClick={handleSearch}>Rechercher</button>
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <ul>
                {clients.map((client) => (
                    <li key={client.id}>{client.name}</li>
                ))}
            </ul>
        </div>
    );
}

export default Index;
