import { Link } from "react-router-dom";
import { FaTrain, FaEnvelope } from "react-icons/fa";
import "../styles/footer.css";

const Footer = () => (
    <footer className="app-footer">
        <div className="footer-inner">
            <div className="footer-brand">
                <FaTrain className="footer-logo-icon" />
                <span className="footer-brand-name">RailGo</span>
                <p className="footer-tagline">Voyager responsable, découvrir la France autrement.</p>
            </div>

            <nav className="footer-links">
                <div className="footer-col">
                    <p className="footer-col-title">Informations</p>
                    <Link to="/mentions-legales">Mentions légales</Link>
                    <Link to="/mentions-legales#confidentialite">Confidentialité</Link>
                </div>
                <div className="footer-col">
                    <p className="footer-col-title">Aide</p>
                    <Link to="/faq">FAQ</Link>
                    <a href="mailto:kimi.0208@outlook.fr" className="footer-contact">
                        <FaEnvelope /> Support
                    </a>
                </div>
            </nav>
        </div>
        <div className="footer-bottom">
            <p>© {new Date().getFullYear()} RailGo — Tous droits réservés</p>
        </div>
    </footer>
);

export default Footer;
