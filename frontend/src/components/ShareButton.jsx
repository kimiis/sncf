import { useState } from "react";
import { FaShare, FaCheck } from "react-icons/fa";

export default function ShareButton({ trajet }) {
    const [copied, setCopied] = useState(false);

    const buildText = () => {
        const co2Saved = trajet.co2_voiture_kg && trajet.co2_train_kg
            ? (trajet.co2_voiture_kg - trajet.co2_train_kg).toFixed(1)
            : null;
        return (
            `🚆 ${trajet.from_city} → ${trajet.to_city}\n` +
            `⏱️ Durée : ${trajet.duree || "N/A"}\n` +
            `💰 Prix indicatif : ${trajet.prix_indicatif ? Math.round(trajet.prix_indicatif) + "€" : "N/A"}\n` +
            (co2Saved ? `🌱 CO₂ économisé vs voiture : ${co2Saved} kg\n` : "") +
            `\nVoyagez écolo avec RailGo 🌍`
        );
    };

    const handleShare = async () => {
        const text = buildText();
        if (navigator.share) {
            try {
                await navigator.share({ title: "Mon trajet RailGo", text });
            } catch {}
        } else {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button className="share-btn" onClick={handleShare}>
            {copied ? <FaCheck /> : <FaShare />}
            {copied ? "Copié !" : "Partager"}
        </button>
    );
}
