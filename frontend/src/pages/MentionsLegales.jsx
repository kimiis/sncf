import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import "../styles/mentionsLegales.css";

export default function MentionsLegales() {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const el = document.querySelector(hash);
            if (el) el.scrollIntoView({ behavior: "smooth" });
        } else {
            window.scrollTo(0, 0);
        }
    }, [hash]);

    return (
        <div className="legal-page">
            <div className="legal-hero">
                <h1>Mentions légales & Confidentialité</h1>
                <p>Dernière mise à jour : avril 2026</p>
            </div>

            <div className="legal-content">
                <section className="legal-section">
                    <h2>1. Éditeur du site</h2>
                    <p>
                        <strong>RailGo</strong> est une application web développée dans le cadre d'un projet étudiant.
                        Elle n'est pas affiliée à SNCF ni à ses filiales.
                    </p>
                    <p>
                        Contact : <a href="mailto:kimi.0208@outlook.fr" className="legal-link"><FaEnvelope /> kimi.0208@outlook.fr</a>
                    </p>
                </section>

                <section className="legal-section">
                    <h2>2. Hébergement</h2>
                    <p>
                        L'application est hébergée localement et déployée à des fins pédagogiques.
                        Aucune infrastructure de production commerciale n'est utilisée.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>3. Propriété intellectuelle</h2>
                    <p>
                        Les données de trajets, horaires et empreintes CO₂ proviennent de <strong>SNCF Open Data</strong> (licence ODbL).
                        Les points d'intérêt proviennent d'<strong>OpenStreetMap</strong> (licence ODbL).
                        La météo est fournie par <strong>Open-Meteo</strong> (licence CC BY 4.0).
                    </p>
                    <p>
                        Le code source, le design et le contenu éditorial de RailGo sont la propriété de leurs auteurs.
                    </p>
                </section>

                <section className="legal-section" id="confidentialite">
                    <h2>4. Politique de confidentialité</h2>

                    <h3>Données collectées</h3>
                    <p>Lors de la création de compte, RailGo collecte :</p>
                    <ul>
                        <li>Prénom, nom, civilité</li>
                        <li>Adresse email</li>
                        <li>Date de naissance</li>
                        <li>Numéro de téléphone (facultatif)</li>
                        <li>Adresse postale (facultative)</li>
                    </ul>
                    <p>En cours d'utilisation, sont également enregistrés :</p>
                    <ul>
                        <li>Historique des recherches de trajets (gares, dates)</li>
                        <li>Trajets favoris</li>
                    </ul>

                    <h3>Utilisation des données</h3>
                    <p>
                        Ces données sont utilisées exclusivement pour le fonctionnement de l'application :
                        personnalisation du profil, affichage de l'historique, calcul du bilan CO₂ personnel et du classement communautaire anonymisé.
                        Aucune donnée n'est vendue, partagée avec des tiers ou utilisée à des fins commerciales.
                    </p>

                    <h3>Stockage et sécurité</h3>
                    <p>
                        Les mots de passe sont hachés avec bcrypt (facteur 10). L'authentification est gérée par token JWT avec une expiration de 24h.
                        Les données sont stockées dans une base PostgreSQL locale.
                    </p>

                    <h3>Durée de conservation</h3>
                    <p>
                        Les données sont conservées tant que le compte est actif. En cas de suppression du compte, toutes les données associées sont définitivement supprimées.
                    </p>

                    <h3>Tes droits</h3>
                    <p>
                        Conformément au RGPD, tu disposes d'un droit d'accès, de rectification et de suppression de tes données.
                        Pour exercer ces droits, contacte-nous à{" "}
                        <a href="mailto:kimi.0208@outlook.fr" className="legal-link">kimi.0208@outlook.fr</a>.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>5. Cookies</h2>
                    <p>
                        RailGo n'utilise pas de cookies de traçage ou publicitaires. Seul le token JWT est stocké en <code>localStorage</code> pour maintenir ta session.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>6. Limitation de responsabilité</h2>
                    <p>
                        Les horaires, prix indicatifs et données CO₂ sont fournis à titre informatif.
                        RailGo ne peut être tenu responsable d'erreurs ou d'inexactitudes dans ces données,
                        ni des décisions prises sur leur base. Pour réserver un billet, utilisez les canaux officiels SNCF.
                    </p>
                </section>

                <div className="legal-contact-block">
                    <p>Une question sur tes données ?</p>
                    <a href="mailto:kimi.0208@outlook.fr" className="legal-contact-btn">
                        <FaEnvelope /> kimi.0208@outlook.fr
                    </a>
                </div>
            </div>
        </div>
    );
}
