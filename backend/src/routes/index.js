const express = require("express");
const router = express.Router();

const userRoutes = require("./UserRoute");
const authRoute = require("./AuthRoute");
const sncfRoutes = require("./SncfRoute");
const trajetRoutes = require("./TrajetRoute");
const statsRoutes = require("./StatsRoute");

// Route racine (page d'accueil de l'API)
router.get("/", (req, res) => {
    res.send("Bienvenue sur l'API SNCF_APP");
});

// Routes
router.use("/users", userRoutes);
router.use("/auth", authRoute);
router.use("/sncf", sncfRoutes);
router.use("/trajet", trajetRoutes);
router.use("/stats", statsRoutes);

module.exports = router;
