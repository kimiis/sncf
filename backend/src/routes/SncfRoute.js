const express = require("express");
const axios = require("axios");
const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:9000";
const TIMEOUT = 5000; // 5 secondes

// Proxy vers FastAPI - Autocomplete
router.get("/autocomplete", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/autocomplete`, {
            params: req.query,
            timeout: TIMEOUT,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur autocomplete:", error.code || error.message);
        if (error.code === "ECONNREFUSED") {
            res.status(503).json({ error: "FastAPI non disponible. Lancez: uvicorn api.app.main:app --reload --port 9000" });
        } else {
            res.status(500).json({ error: "Erreur lors de l'autocomplete" });
        }
    }
});

// Proxy vers FastAPI - Liste des gares
router.get("/gares", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/gares`, {
            timeout: TIMEOUT,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur gares:", error.code || error.message);
        if (error.code === "ECONNREFUSED") {
            res.status(503).json({ error: "FastAPI non disponible. Lancez: uvicorn api.app.main:app --reload --port 9000" });
        } else {
            res.status(500).json({ error: "Erreur lors de la récupération des gares" });
        }
    }
});

// Proxy vers FastAPI - Trajet
router.get("/trajet", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/trajet`, {
            params: req.query,
            timeout: 30000, // 30s pour trajet (appels Overpass lents)
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur trajet:", error.code || error.message);
        if (error.code === "ECONNREFUSED") {
            res.status(503).json({ error: "FastAPI non disponible. Lancez: uvicorn api.app.main:app --reload --port 9000" });
        } else {
            res.status(500).json({ error: "Erreur lors de la récupération du trajet" });
        }
    }
});

// Proxy vers FastAPI - POI proches des gares (hotels, velos, activites, parkings)
router.get("/trajet/poi", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/trajet/poi`, {
            params: req.query,
            timeout: 60000, // 60s pour les appels Overpass
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur trajet/poi:", error.code || error.message);
        if (error.code === "ECONNREFUSED") {
            res.status(503).json({ error: "FastAPI non disponible." });
        } else {
            res.status(500).json({ error: "Erreur lors de la récupération des POI" });
        }
    }
});

// Proxy vers FastAPI - Gare la plus proche (géolocalisation)
router.get("/gare-proche", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/gare-proche`, {
            params: req.query,
            timeout: TIMEOUT,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur gare-proche:", error.code || error.message);
        res.status(500).json({ error: "Erreur géolocalisation" });
    }
});

// Proxy vers FastAPI - Destinations coup de coeur
router.get("/destinations", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/sncf/destinations`, {
            timeout: 30000,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur destinations:", error.code || error.message);
        if (error.code === "ECONNREFUSED") {
            res.status(503).json({ error: "FastAPI non disponible." });
        } else {
            res.status(500).json({ error: "Erreur lors de la récupération des destinations" });
        }
    }
});

// Tableau de départs temps réel (Navitia)
router.get("/departures", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/departures`, {
            params: req.query,
            timeout: 10000,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur departures:", error.code || error.message);
        res.status(500).json({ departures: [] });
    }
});

// Perturbations trafic (Navitia)
router.get("/disruptions", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/disruptions`, {
            params: req.query,
            timeout: 10000,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur disruptions:", error.code || error.message);
        res.status(500).json({ disruptions: [] });
    }
});

// Destinations atteignables depuis une gare (basé sur distances Excel SNCF)
router.get("/reachable", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/reachable`, {
            params: req.query,
            timeout: 15000,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur reachable:", error.code || error.message);
        res.status(500).json({ stations: [] });
    }
});

// Prédiction ML — XGBoost prix + rapport d'évaluation
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

router.get("/ml/report", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/ml/report`, { timeout: 5000 });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur ml/report:", error.code || error.message);
        res.status(500).json({ error: "Rapport ML non disponible" });
    }
});

module.exports = router;
