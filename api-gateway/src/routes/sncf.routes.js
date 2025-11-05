import express from "express";
import axios from "axios";

const router = express.Router();

// === Service CO2 ===
router.post("/co2/trajet", async (req, res) => {
    try {
        // Appel au microservice FastAPI (sncf-co2-service)
        const response = await axios.post(
            process.env.CO2_SERVICE_URL || "http://localhost:5002/co2/trajet",
            req.body
        );
        res.json(response.data);
    } catch (err) {
        console.error("Erreur vers service CO2:", err.message);
        res.status(500).json({ error: "Erreur de connexion au service CO2" });
    }
});

export default router;
