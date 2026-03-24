const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const FavoriteItinary = require("../models/FavoriteItinary");
const SearchHistory = require("../models/SearchHistory");

// GET /api/trajet/favorites — liste des favoris du user connecté
router.get("/favorites", verifyToken, async (req, res) => {
    try {
        const favorites = await FavoriteItinary.findAll({
            where: { user_id: req.user.id },
            order: [["created_at", "DESC"]],
        });
        res.json(favorites);
    } catch (error) {
        console.error("Erreur favorites GET:", error.message);
        res.status(500).json({ error: "Erreur lors de la récupération des favoris" });
    }
});

// POST /api/trajet/favorites — ajouter un favori
router.post("/favorites", verifyToken, async (req, res) => {
    try {
        const { gare_depart, gare_arrivee } = req.body;
        if (!gare_depart || !gare_arrivee) {
            return res.status(400).json({ error: "gare_depart et gare_arrivee sont requis" });
        }
        const existing = await FavoriteItinary.findOne({
            where: { user_id: req.user.id, gare_depart, gare_arrivee },
        });
        if (existing) {
            return res.status(409).json({ error: "Ce trajet est déjà en favoris" });
        }
        const favorite = await FavoriteItinary.create({
            user_id: req.user.id,
            gare_depart,
            gare_arrivee,
        });
        res.status(201).json(favorite);
    } catch (error) {
        console.error("Erreur favorites POST:", error.message);
        res.status(500).json({ error: "Erreur lors de l'ajout aux favoris" });
    }
});

// DELETE /api/trajet/favorites/:id — supprimer un favori
router.delete("/favorites/:id", verifyToken, async (req, res) => {
    try {
        const deleted = await FavoriteItinary.destroy({
            where: { favorites_itinary_id: req.params.id, user_id: req.user.id },
        });
        if (!deleted) return res.status(404).json({ error: "Favori non trouvé" });
        res.json({ message: "Favori supprimé" });
    } catch (error) {
        console.error("Erreur favorites DELETE:", error.message);
        res.status(500).json({ error: "Erreur lors de la suppression du favori" });
    }
});

// GET /api/trajet/history — historique du user connecté
router.get("/history", verifyToken, async (req, res) => {
    try {
        const history = await SearchHistory.findAll({
            where: { user_id: req.user.id },
            order: [["created_at", "DESC"]],
            limit: 10,
        });
        res.json(history);
    } catch (error) {
        console.error("Erreur history GET:", error.message);
        res.status(500).json({ error: "Erreur lors de la récupération de l'historique" });
    }
});

// POST /api/trajet/history — sauvegarder une recherche
router.post("/history", verifyToken, async (req, res) => {
    try {
        const { gare_depart, gare_arrivee, date_recherche, duree, co2_economise, prix } = req.body;
        if (!gare_depart || !gare_arrivee) {
            return res.status(400).json({ error: "gare_depart et gare_arrivee sont requis" });
        }
        const entry = await SearchHistory.create({
            user_id: req.user.id,
            gare_depart,
            gare_arrivee,
            date_recherche: date_recherche || new Date().toISOString().split("T")[0],
            type_train: JSON.stringify({ duree, co2_economise, prix }),
        });
        res.status(201).json(entry);
    } catch (error) {
        console.error("Erreur history POST:", error.message);
        res.status(500).json({ error: "Erreur lors de la sauvegarde de l'historique" });
    }
});

module.exports = router;
