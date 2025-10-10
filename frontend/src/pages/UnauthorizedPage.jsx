import { Link } from "react-router-dom";

const Unauthorized = () => {
    return (
        <div style={{ padding: "3rem", textAlign: "center" }}>
            <h1>Accès refusé</h1>
            <p>Vous n\&#39;avez pas l\&#39;autorisation d&#39;accéder à cette page.</p>
            <Link to="/">Retour à l&#39;accueil</Link>
        </div>
    );
};

export default Unauthorized;
