const express = require("express");
const router = express.Router();
const sncfRoutes = require("./sncf.routes");

router.use("/sncf", sncfRoutes);

// Route test principale
router.get("/", (req, res) => {
    console.log("[GET] /api hit (route test principale)");
    res.send("API Gateway routes OK");
});

module.exports = router;
