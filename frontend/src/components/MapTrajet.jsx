import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";

const API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImE4ZmFhOTIzMThjOTRkOTNhZTI0YjBjMmU4YzI0YjMyIiwiaCI6Im11cm11cjY0In0=";

function MapTrajet({ depart, arrivee }) {
    const [coords, setCoords] = useState([]);

    useEffect(() => {
        const fetchRoute = async () => {
            try {
                const response = await axios.post(
                    "https://api.openrouteservice.org/v2/directions/driving-car",
                    {
                        coordinates: [
                            [ -1.5536, 47.2184 ], // Nantes
                            [ 4.8357, 45.7640 ]   // Lyon
                        ],
                    },
                    { headers: { Authorization: API_KEY } }
                );

                const geometry = response.data.features[0].geometry.coordinates;
                const latlngs = geometry.map(([lon, lat]) => [lat, lon]);
                setCoords(latlngs);
            } catch (error) {
                console.error("Erreur OpenRouteService:", error);
            }
        };

        fetchRoute();
    }, [depart, arrivee]);

    return (
        <MapContainer center={[47.5, 2.5]} zoom={6} style={{ height: "400px", width: "100%" }}>
            <TileLayer
                attribution="© OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {coords.length > 0 && <Polyline positions={coords} color="red" />}
            {coords.length > 0 && (
                <>
                    <Marker position={coords[0]}><Popup>{depart}</Popup></Marker>
                    <Marker position={coords[coords.length - 1]}><Popup>{arrivee}</Popup></Marker>
                </>
            )}
        </MapContainer>
    );
}

export default MapTrajet;
