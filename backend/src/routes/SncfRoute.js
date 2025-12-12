const express = require("express");
const axios = require("axios");
const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:9000";

// Proxy vers FastAPI - Autocomplete
router.get("/autocomplete", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/autocomplete`, {
            params: req.query,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur autocomplete:", error.message);
        res.status(500).json({ error: "Erreur lors de l'autocomplete" });
    }
});

// Proxy vers FastAPI - Liste des gares
router.get("/gares", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/gares`);
        res.json(response.data);
    } catch (error) {
        console.error("Erreur gares:", error.message);
        res.status(500).json({ error: "Erreur lors de la récupération des gares" });
    }
});

// Proxy vers FastAPI - Trajet
router.get("/trajet", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/trajet`, {
            params: req.query,
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur trajet:", error.message);
        res.status(500).json({ error: "Erreur lors de la récupération du trajet" });
    }
});

module.exports = router;
