import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaEnvelope } from "react-icons/fa";
import "../styles/faq.css";

const FAQS = [
    {
        category: "Recherche de trajet",
        items: [
            {
                q: "Comment rechercher un trajet ?",
                a: "Sur la page d'accueil, saisis ta gare de départ et ta destination. Tu peux aussi utiliser le bouton de géolocalisation pour détecter automatiquement la gare la plus proche. Sélectionne une date et clique sur Rechercher.",
            },
            {
                q: "Les horaires affichés sont-ils en temps réel ?",
                a: "Oui. Les prochains départs et horaires proviennent directement de l'API SNCF (api.sncf.com) et sont actualisés à chaque recherche.",
            },
            {
                q: "Le bouton \"Surprends-moi\" fait quoi ?",
                a: "Il sélectionne une destination aléatoire parmi notre sélection de 20 coups de cœur et lance la recherche depuis ta gare de départ.",
            },
            {
                q: "Pourquoi certains trajets n'ont pas de prix ?",
                a: "Les prix affichés sont des tarifs indicatifs issus des données SNCF Open Data. Ils représentent des fourchettes historiques, pas les prix de vente en temps réel. Pour réserver, rendez-vous sur SNCF Connect.",
            },
        ],
    },
    {
        category: "Environnement & CO₂",
        items: [
            {
                q: "Comment est calculé le CO₂ économisé ?",
                a: "On soustrait l'empreinte carbone du train (données SNCF Open Data, ou coefficient ADEME 0,0194 kg/km) à celle de la voiture (coefficient ADEME 0,122 kg/km). L'avion est affiché uniquement pour les distances supérieures à 300 km.",
            },
            {
                q: "D'où viennent les données CO₂ du train ?",
                a: "Du fichier SNCF Open Data « emission-co2-perimetre-usage.xlsx » pour les trajets référencés. Pour les autres, on utilise les coefficients officiels de l'ADEME.",
            },
        ],
    },
    {
        category: "Mon compte",
        items: [
            {
                q: "Comment créer un compte ?",
                a: "Clique sur l'icône de connexion en haut à droite de la navbar, puis sur « S'inscrire ». Remplis le formulaire avec ton prénom, nom, date de naissance et email.",
            },
            {
                q: "Mes recherches sont-elles sauvegardées ?",
                a: "Oui, si tu es connecté. Chaque recherche est enregistrée dans ton historique (accessible depuis ton profil). Cela permet de calculer ton bilan CO₂ personnel.",
            },
            {
                q: "Comment supprimer mon compte ?",
                a: "Va dans ton profil → onglet Informations → bouton « Supprimer mon compte » en bas de page. Une confirmation sera demandée. Cette action est irréversible.",
            },
            {
                q: "Mon token de connexion a expiré, que faire ?",
                a: "Les sessions durent 24h. Déconnecte-toi (icône en haut à droite) et reconnecte-toi pour obtenir un nouveau token.",
            },
        ],
    },
    {
        category: "Points d'intérêt & transports",
        items: [
            {
                q: "D'où viennent les hôtels et activités affichés ?",
                a: "Des données OpenStreetMap via l'API Overpass. Ce sont des données contributives mises à jour par la communauté. RailGo maintient un cache de 5 minutes pour éviter les limitations de débit.",
            },
            {
                q: "Les transports locaux à destination sont-ils en temps réel ?",
                a: "Oui pour les villes couvertes (Paris, Nantes, Caen, Rouen, La Rochelle, et la région Nouvelle-Aquitaine). Les données proviennent des APIs GTFS-RT des réseaux locaux.",
            },
        ],
    },
    {
        category: "Technique & confidentialité",
        items: [
            {
                q: "Mes données sont-elles partagées ?",
                a: "Non. Tes données (compte, historique, favoris) sont stockées dans notre base de données et ne sont jamais vendues ni transmises à des tiers. Consulte notre page Mentions légales pour plus de détails.",
            },
            {
                q: "L'application fonctionne-t-elle hors ligne ?",
                a: "Non. RailGo nécessite une connexion internet pour récupérer les horaires, la météo et les points d'intérêt en temps réel.",
            },
        ],
    },
];

function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`faq-item ${open ? "open" : ""}`}>
            <button className="faq-question" onClick={() => setOpen((v) => !v)}>
                <span>{q}</span>
                {open ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {open && <div className="faq-answer">{a}</div>}
        </div>
    );
}

export default function FAQ() {
    return (
        <div className="faq-page">
            <div className="faq-hero">
                <h1>Questions fréquentes</h1>
                <p>Tout ce que tu dois savoir sur RailGo</p>
            </div>

            <div className="faq-content">
                {FAQS.map((section) => (
                    <section key={section.category} className="faq-section">
                        <h2 className="faq-category">{section.category}</h2>
                        <div className="faq-list">
                            {section.items.map((item) => (
                                <FAQItem key={item.q} q={item.q} a={item.a} />
                            ))}
                        </div>
                    </section>
                ))}

                <div className="faq-contact-block">
                    <p>Tu n'as pas trouvé ta réponse ?</p>
                    <a href="mailto:kimi.0208@outlook.fr" className="faq-contact-btn">
                        <FaEnvelope /> Contacter le support
                    </a>
                </div>
            </div>
        </div>
    );
}
