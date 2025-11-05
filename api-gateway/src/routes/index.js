const express = require("express");
const router = express.Router();
const sncfRoutes = require("./sncf.routes");

// --- LOG DE DÉMARRAGE ---
console.log("\n===== 📦 Routeur principal chargé (routes/index.js) =====");
console.log("🧩 Type de sncfRoutes :", typeof sncfRoutes);
console.log("🧠 sncfRoutes stack :", sncfRoutes.stack?.map(layer => layer.route?.path || "(sub-router)") || []);
console.log("🚏 Monté sous le chemin : /sncf");
console.log("==========================================================");
console.log("📂 __dirname =", __dirname);
console.log("📂 Résolution de sncf.routes =", require.resolve("./sncf.routes"));

// ✅ Monte le sous-routeur SNCF sous /sncf
router.use("/sncf", sncfRoutes);

// Route test principale
router.get("/", (req, res) => {
    console.log("➡️  [GET] /api hit (route test principale)");
    res.send("✅ API Gateway routes OK");
});

module.exports = router;
