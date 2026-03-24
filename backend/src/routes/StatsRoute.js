const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const SearchHistory = require("../models/SearchHistory");
const User = require("../models/UserModel");
const { sequelize } = require("../config/Database");
const { Op } = require("sequelize");

// GET /api/stats/global — stats globales CO2 + nb trajets de tous les users
router.get("/global", async (req, res) => {
    try {
        const totalTrajets = await SearchHistory.count();

        // CO2 économisé: on extrait depuis le champ type_train (JSON stocké)
        const allHistory = await SearchHistory.findAll({
            attributes: ["type_train"],
        });

        let totalCo2 = 0;
        for (const entry of allHistory) {
            try {
                const extra = JSON.parse(entry.type_train || "{}");
                const co2 = parseFloat(extra.co2_economise) || 0;
                totalCo2 += co2;
            } catch {}
        }

        res.json({
            total_trajets: totalTrajets,
            total_co2_economise_kg: Math.round(totalCo2 * 10) / 10,
            arbres_equivalents: Math.round(totalCo2 / 21),
        });
    } catch (error) {
        console.error("Erreur stats global:", error.message);
        res.status(500).json({ error: "Erreur stats" });
    }
});

// GET /api/stats/leaderboard — top 10 users par CO2 économisé (anonymisé)
router.get("/leaderboard", async (req, res) => {
    try {
        const allHistory = await SearchHistory.findAll({
            attributes: ["user_id", "type_train"],
        });

        // Agréger CO2 par user
        const co2ByUser = {};
        for (const entry of allHistory) {
            if (!entry.user_id) continue;
            try {
                const extra = JSON.parse(entry.type_train || "{}");
                const co2 = parseFloat(extra.co2_economise) || 0;
                co2ByUser[entry.user_id] = (co2ByUser[entry.user_id] || 0) + co2;
            } catch {}
        }

        const topUserIds = Object.entries(co2ByUser)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id]) => id);

        const users = await User.findAll({
            where: { user_id: { [Op.in]: topUserIds } },
            attributes: ["user_id", "first_name", "last_name"],
        });

        const leaderboard = topUserIds.map((uid, rank) => {
            const user = users.find((u) => u.user_id === uid);
            return {
                rank: rank + 1,
                nom: user ? `${user.first_name} ${user.last_name.charAt(0)}.` : "Anonyme",
                co2_economise_kg: Math.round(co2ByUser[uid] * 10) / 10,
            };
        });

        res.json(leaderboard);
    } catch (error) {
        console.error("Erreur leaderboard:", error.message);
        res.status(500).json({ error: "Erreur leaderboard" });
    }
});

// POST /api/stats/price-alert — sauvegarder une alerte prix (user connecté)
router.post("/price-alert", verifyToken, async (req, res) => {
    try {
        const { gare_depart, gare_arrivee, prix_max } = req.body;
        if (!gare_depart || !gare_arrivee || !prix_max) {
            return res.status(400).json({ error: "Champs manquants" });
        }
        // Stocker comme une entrée SearchHistory spéciale (type_train = alert JSON)
        const alert = await SearchHistory.create({
            user_id: req.user.id,
            gare_depart,
            gare_arrivee,
            type_train: JSON.stringify({ alerte_prix: true, prix_max }),
        });
        res.status(201).json(alert);
    } catch (error) {
        console.error("Erreur price-alert:", error.message);
        res.status(500).json({ error: "Erreur alerte prix" });
    }
});

// GET /api/stats/price-alerts — alertes prix du user connecté
router.get("/price-alerts", verifyToken, async (req, res) => {
    try {
        const alerts = await SearchHistory.findAll({
            where: { user_id: req.user.id },
        });
        const filtered = alerts
            .filter((a) => {
                try { return JSON.parse(a.type_train || "{}").alerte_prix === true; } catch { return false; }
            })
            .map((a) => {
                const extra = JSON.parse(a.type_train);
                return {
                    id: a.search_history_id,
                    gare_depart: a.gare_depart,
                    gare_arrivee: a.gare_arrivee,
                    prix_max: extra.prix_max,
                };
            });
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération alertes" });
    }
});

// DELETE /api/stats/price-alerts/:id
router.delete("/price-alerts/:id", verifyToken, async (req, res) => {
    try {
        const deleted = await SearchHistory.destroy({
            where: { search_history_id: req.params.id, user_id: req.user.id },
        });
        if (!deleted) return res.status(404).json({ error: "Alerte non trouvée" });
        res.json({ message: "Alerte supprimée" });
    } catch (error) {
        res.status(500).json({ error: "Erreur suppression alerte" });
    }
});

module.exports = router;
