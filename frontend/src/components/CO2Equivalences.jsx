import { useEffect, useState } from "react";
import { FaTree, FaCar, FaFire, FaMobileAlt, FaLeaf } from "react-icons/fa";

const EQUIVALENCES = [
    { icon: <FaTree />,      label: "arbres plantés",           factor: 1 / 21,    unit: "" },
    { icon: <FaCar />,       label: "km de voiture évités",     factor: 1 / 0.122, unit: "km" },
    { icon: <FaFire />,      label: "jours de chauffage évités",factor: 1 / 8,     unit: "" },
    { icon: <FaMobileAlt />, label: "charges de smartphone",    factor: 1 / 0.008, unit: "" },
];

export default function CO2Equivalences({ co2SavedKg }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 200);
        return () => clearTimeout(timer);
    }, []);

    if (!co2SavedKg || co2SavedKg <= 0) return null;

    return (
        <div className={`co2-equiv-section ${visible ? "co2-visible" : ""}`}>
            <h3 className="co2-equiv-title">
                <FaLeaf /> En prenant ce train tu économises <strong>{co2SavedKg.toFixed(1)} kg de CO₂</strong>, soit&nbsp;:
            </h3>
            <div className="co2-equiv-grid">
                {EQUIVALENCES.map(({ icon, label, factor, unit }) => {
                    const val = co2SavedKg * factor;
                    const display = val >= 10 ? Math.round(val) : val.toFixed(1);
                    return (
                        <div key={label} className="co2-equiv-card">
                            <span className="co2-equiv-icon">{icon}</span>
                            <span className="co2-equiv-value">{display}{unit && ` ${unit}`}</span>
                            <span className="co2-equiv-label">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
