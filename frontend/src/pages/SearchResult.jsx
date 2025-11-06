import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import api from "../api/axios";
import "../styles/searchBar.css";

// Composant utilitaire pour forcer Leaflet à recalculer la taille
function MapAutoResize() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }, [map]);
    return null;
}

export default function SearchResult() {
    const [params] = useSearchParams();
    const fromCity = params.get("from");
    const toCity = params.get("to");

    const [trajet, setTrajet] = useState(null);
    const [error, setError] = useState("");

    // --- Récupération du trajet via l’API ---
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

    // --- Extraction des coordonnées ---
    const sections = trajet.trajet_api_sncf_detail?.sections || [];
    const allCoords = [];

    sections.forEach((s) => {
        if (s.geojson && Array.isArray(s.geojson.coordinates)) {
            // L’API SNCF renvoie [lon, lat], Leaflet veut [lat, lon]
            const coords = s.geojson.coordinates.map(([lon, lat]) => [lat, lon]);
            allCoords.push(...coords);
        }
    });

    const start = trajet.coordonnees_depart;
    const end = trajet.coordonnees_arrivee;
    const startPos = [start.latitude, start.longitude];
    const endPos = [end.latitude, end.longitude];
    const center =
        allCoords.length > 0
            ? allCoords[Math.floor(allCoords.length / 2)]
            : startPos;
    const position = [51.505, -0.09]
    // --- Rendu ---
    return (
        <div className="search-result-page">
            <h2>
                Trajet {trajet.from_city} → {trajet.to_city}
            </h2>
            <p>Durée : {trajet.duree}</p>
            <p>Distance : {trajet.distance_km?.toFixed(1)} km</p>
            <p>Prix moyen : {trajet.prix_moyen?.toFixed(2)} €</p>
            <p>🌱 Train : {trajet.co2_train_kg?.toFixed(2)} kg CO₂</p>
            <p>🚗 Voiture : {trajet.co2_voiture_kg?.toFixed(2)} kg CO₂</p>

            {/* === Carte Leaflet conforme à la doc === */}


            <MapContainer center={position} zoom={13} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>
                        A pretty CSS3 popup. <br /> Easily customizable.
                    </Popup>
                </Marker>
            </MapContainer>
            )
            {/*<MapContainer*/}
            {/*    key={`${center[0]}-${center[1]}`}*/}
            {/*    center={center}*/}
            {/*    zoom={6}*/}
            {/*    scrollWheelZoom={true}*/}
            {/*    style={{ height: "500px", width: "100%" }}*/}
            {/*>*/}
            {/*    <MapAutoResize />*/}
            {/*    <TileLayer*/}
            {/*        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/}
            {/*        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"*/}
            {/*    />*/}

            {/*    <Marker position={startPos}>*/}
            {/*        <Popup>Départ : {trajet.from_city}</Popup>*/}
            {/*    </Marker>*/}

            {/*    <Marker position={endPos}>*/}
            {/*        <Popup>Arrivée : {trajet.to_city}</Popup>*/}
            {/*    </Marker>*/}

            {/*    {allCoords.length > 0 && (*/}
            {/*        <Polyline positions={allCoords} color="red" weight={4} />*/}
            {/*    )}*/}
            {/*</MapContainer>*/}
        </div>
    );
}
