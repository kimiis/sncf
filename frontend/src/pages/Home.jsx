import logo from "../assets/logo_sncf.png";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
    return (
        <div className="home-container">
            <img
                className="imgHome"
                src={logo}
                alt="Logo SNCF Zen"
            />
            <h1>ZEN ET GREEN, VOYAGE MALIN</h1>
            {/*<button*/}
            {/*    className="home-button"*/}
            {/*    onClick={() => navigate("/login")}*/}
            {/*>*/}
            {/*    Commencez l&#39;expérience OMELIA*/}
            {/*</button>*/}
        </div>
    );
}

export default Home;
