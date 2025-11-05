const express = require("express");
const axios = require("axios");
const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:9000";

console.log("\n===== 🚄 SNCF ROUTER INITIALIZED =====");
console.log("🌐 FastAPI target URL:", FASTAPI_URL);
console.log("🛣  Local routes handled by this router: /ping, /trajet");
console.log("=====================================");

// --- Routes SNCF ---
router.get("/ping", (req, res) => {
    console.log("➡️  [GET] /api/sncf/ping hit");
    res.json({ message: "pong ✅" });
});

router.get("/trajet", async (req, res) => {
    const { from_city, to_city } = req.query;
    console.log(`➡️  [GET] /api/sncf/trajet?from_city=${from_city}&to_city=${to_city}`);
    try {
        const response = await axios.get(`${FASTAPI_URL}/trajet`, { params: { from_city, to_city } });
        console.log("✅ FastAPI response received, distance:", response.data.distance_km, "km");
        res.json(response.data);
    } catch (err) {
        console.error("❌ FastAPI error:", err.message);
        res.status(err.response?.status || 500).json({ error: "Erreur FastAPI" });
    }
});
router.use((req, res) => {
    console.log("⚠️ Route inconnue dans sncf.routes :", req.method, req.url);
    res.status(404).json({ error: "Route inconnue dans sncf.routes" });
});
console.log("📋 Stack finale sncfRoutes :", router.stack.map(l => l.route?.path || l.name));

module.exports = router;
