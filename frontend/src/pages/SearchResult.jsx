import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import api from "../api/axios";

function SearchResult() {
    const [params] = useSearchParams();
    const fromCity = params.get("from");
    const toCity = params.get("to");
    const [trajet, setTrajet] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTrajet = async () => {
            try {
                const { data } = await api.get("/sncf/trajet", {
                    params: { from_city: fromCity, to_city: toCity },
                });
                setTrajet(data);
            } catch (err) {
                console.error(err);
                setError("Impossible de récupérer le trajet.");
            }
        };
        fetchTrajet();
    }, [fromCity, toCity]);

    if (error) return <p className="error">{error}</p>;
    if (!trajet) return <p>Chargement du trajet...</p>;

    // Extraction des points réels depuis l’API SNCF
    const sections = trajet.trajet_api_sncf_detail?.sections || [];
    const allCoords = [];

    sections.forEach((s) => {
        if (s.geojson && Array.isArray(s.geojson.coordinates)) {
            // ⚠️ L’API SNCF renvoie [lon, lat], Leaflet veut [lat, lon]
            const coords = s.geojson.coordinates.map(([lon, lat]) => [lat, lon]);
            allCoords.push(...coords);
        }
    });

    const start = trajet.coordonnees_depart;
    const end = trajet.coordonnees_arrivee;
    const startPos = [start.latitude, start.longitude];
    const endPos = [end.latitude, end.longitude];

    const center = allCoords.length
        ? allCoords[Math.floor(allCoords.length / 2)]
        : startPos;

    return (
        <div className="search-result-page">
            <h2>Trajet {trajet.from_city} → {trajet.to_city}</h2>
            <p>Durée : {trajet.duree}</p>
            <p>Distance : {trajet.distance_km?.toFixed(1)} km</p>
            <p>Prix moyen : {trajet.prix_moyen?.toFixed(2)} €</p>
            <p>🌱 Train : {trajet.co2_train_kg?.toFixed(2)} kg CO₂</p>
            <p>🚗 Voiture : {trajet.co2_voiture_kg?.toFixed(2)} kg CO₂</p>

            <MapContainer center={center} zoom={6} style={{ height: "500px", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />

                {/* Points de départ et d’arrivée */}
                <Marker position={startPos}><Popup>{trajet.from_city}</Popup></Marker>
                <Marker position={endPos}><Popup>{trajet.to_city}</Popup></Marker>

                {/* Tracé complet du train */}
                {allCoords.length > 0 && (
                    <Polyline positions={allCoords} color="red" weight={4} />
                )}
            </MapContainer>
        </div>
    );
}

export default SearchResult;
