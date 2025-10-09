import express from "express";
import axios from "axios";
import { cacheMiddleware } from "../middlewares/cache.js";

const router = express.Router();
const SNCF_URL = process.env.SNCF_SERVICE_URL || "http://localhost:3001";

router.get("/trains", cacheMiddleware(60), async (req, res) => {
    try {
        const { data } = await axios.get(`${SNCF_URL}/trains`, {
            params: req.query,
        });
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors de la récupération des trains" });
    }
});

export default router;
