import logo from "../assets/railgo_logo.svg";
import { useNavigate } from "react-router-dom";
import {useEffect} from "react";

function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        // après 5 sec, redirection vers /index
        const timer = setTimeout(() => {
            navigate("/index");
        }, 3000);

        // reset le timeout
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="home-container">
            <img
                className="imgHome"
                src={logo}
                alt="Logo RailGo"
            />
            <h1 className= "slogan">Voyager mieux c'est déjà changer le monde</h1>
        </div>
    );
}

export default Home;
