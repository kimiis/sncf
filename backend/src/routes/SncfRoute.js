const express = require("express");
const axios = require("axios");
const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:9000";

// Proxy vers FastAPI - Liste des gares
router.get("/gares", async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/gares`);
        res.json(response.data);
    } catch (err) {
        console.error("Erreur FastAPI /gares :", err.message);
        res.status(err.response?.status || 500).json({ error: "Erreur FastAPI /gares" });
    }
});

// Proxy vers FastAPI - Autocomplete
router.get("/autocomplete", async (req, res) => {
    const { q } = req.query;
    try {
        const response = await axios.get(`${FASTAPI_URL}/autocomplete`, { params: { q } });
        res.json(response.data);
    } catch (err) {
        console.error("Erreur FastAPI /autocomplete :", err.message);
        res.status(err.response?.status || 500).json({ error: "Erreur FastAPI /autocomplete" });
    }
});

// Proxy vers FastAPI - Trajet
router.get("/trajet", async (req, res) => {
    const { from_city, to_city } = req.query;
    try {
        const response = await axios.get(`${FASTAPI_URL}/trajet`, { params: { from_city, to_city } });
        res.json(response.data);
    } catch (err) {
        console.error("Erreur FastAPI /trajet :", err.message);
        res.status(err.response?.status || 500).json({ error: "Erreur FastAPI /trajet" });
    }
});

module.exports = router;