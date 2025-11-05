import logo from "../assets/Logo-train-go-eco.png";
import { useNavigate } from "react-router-dom";
import {useEffect} from "react";

function Profil() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <h1 className= "slogan">Voyager mieux c'est déjà changer le monde</h1>
        </div>
    );
}

export default Profil;
