const express = require("express");
const router = express.Router();

const userRoutes = require("./UserRoute");
const authRoute = require("./AuthRoute");

// Route racine (page d'accueil de l'API)
router.get("/", (req, res) => {
    res.send("Bienvenue sur l’API SNCF_APP 🚄");
});

// Route des utilisateurs
router.use("/users", userRoutes);
router.use("/auth", authRoute);

module.exports = router;
