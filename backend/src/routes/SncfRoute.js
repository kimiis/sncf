const express = require("express");
const axios = require("axios");
const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:9000";
const TIMEOUT = 10000; // 10 secondes

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
            timeout: TIMEOUT,
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

module.exports = router;
