const express = require("express");
const axios = require("axios");
const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:9000";

const proxy = (url, timeout = 5000) => async (req, res) => {
    try {
        const response = await axios.get(url, { params: req.query, timeout });
        res.json(response.data);
    } catch (error) {
        console.error(`Erreur ${url}:`, error.code || error.message);
        if (error.code === "ECONNREFUSED") {
            res.status(503).json({ error: "FastAPI non disponible. Lancez: uvicorn api.app.main:app --reload --port 9000" });
        } else {
            res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Erreur serveur" });
        }
    }
};

router.get("/autocomplete",   proxy(`${FASTAPI_URL}/autocomplete`));
router.get("/gares",          proxy(`${FASTAPI_URL}/gares`));
router.get("/gare-proche",    proxy(`${FASTAPI_URL}/gare-proche`));
router.get("/departures",     proxy(`${FASTAPI_URL}/departures`, 10000));
router.get("/disruptions",    proxy(`${FASTAPI_URL}/disruptions`, 10000));
router.get("/reachable",      proxy(`${FASTAPI_URL}/reachable`, 15000));
router.get("/ml/report",      proxy(`${FASTAPI_URL}/ml/report`));
router.get("/destinations",   proxy(`${FASTAPI_URL}/sncf/destinations`, 60000));
router.get("/trajet",         proxy(`${FASTAPI_URL}/trajet`, 30000));
router.get("/trajet/poi",     proxy(`${FASTAPI_URL}/trajet/poi`, 60000));

router.get("/ml/predict-price", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/ml/predict-price`, {
            params: req.query,
            timeout: 10000,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur ml/predict-price:", error.code || error.message);
        if (error.response?.status === 503) {
            res.status(503).json({ error: "Modèles ML non disponibles. Exécutez : python ml/train.py" });
        } else {
            res.status(500).json({ error: "Erreur prédiction ML" });
        }
    }
});

router.get("/transport/city-departures", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/transport/city-departures`, {
            params: req.query,
            timeout: 12000,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur transport local:", error.code || error.message);
        res.status(200).json({ departures: [], message: "Transports locaux non disponibles" });
    }
});

module.exports = router;
