import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import MapTrajet from "../components/MapTrajet";

function SearchResult() {
    const { state } = useLocation();
    const { depart, arrivee, distance } = state;
    const [co2Data, setCo2Data] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.post("http://localhost:8080/api/co2/trajet", {
                depart,
                arrivee,
                distance,
            });
            setCo2Data(response.data);
        };
        fetchData();
    }, [depart, arrivee, distance]);

    return (
        <div className="result-page">
            <h2>Trajet : {depart} → {arrivee}</h2>

            {/* Carte */}
            <MapTrajet depart={depart} arrivee={arrivee} />

            {/* Données CO2 */}
            {co2Data && (
                <section className="co2-section">
                    <h3>Émissions CO₂ estimées</h3>
                    <div className="co2-cards">
                        <div className="card">
                            <p>Train</p>
                            <strong>{co2Data.co2_train} kg CO₂</strong>
                        </div>
                        <div className="card">
                            <p>Voiture</p>
                            <strong>{co2Data.co2_voiture} kg CO₂</strong>
                        </div>
                        <div className="card">
                            <p>Réduction</p>
                            <strong>{co2Data.reduction_pct}%</strong>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default SearchResult;
