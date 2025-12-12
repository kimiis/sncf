const express = require("express");
const router = express.Router();

const userRoutes = require("./UserRoute");
const authRoute = require("./AuthRoute");
const sncfRoutes = require("./SncfRoute");

// Route racine (page d'accueil de l'API)
router.get("/", (req, res) => {
    res.send("Bienvenue sur l'API SNCF_APP");
});

// Routes
router.use("/users", userRoutes);
router.use("/auth", authRoute);
router.use("/sncf", sncfRoutes);

module.exports = router;
