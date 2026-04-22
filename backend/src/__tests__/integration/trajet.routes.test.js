/**
 * Tests d'intégration — Routes trajet (/api/trajet)
 * On mock les modèles Sequelize et le middleware JWT.
 */
const request = require("supertest");
const jwt = require("jsonwebtoken");

// Mocks globaux
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
jest.mock("morgan", () => () => (req, res, next) => next());
jest.mock("../../models/FavoriteItinary");
jest.mock("../../models/SearchHistory");

const FavoriteItinary = require("../../models/FavoriteItinary");
const SearchHistory = require("../../models/SearchHistory");
const app = require("../../app");

// Helper — génère un token JWT valide pour les tests
function makeToken(payload = { id: "user-uuid", role: "user" }) {
    return jwt.sign(payload, process.env.JWT_SECRET || "secret_key", { expiresIn: "1h" });
}

describe("GET /api/trajet/favorites", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "secret_key";
    });

    test("200 — retourne la liste des favoris de l'utilisateur", async () => {
        const favs = [
            { favorites_itinary_id: 1, gare_depart: "Paris", gare_arrivee: "Lyon" },
        ];
        FavoriteItinary.findAll.mockResolvedValue(favs);

        const res = await request(app)
            .get("/api/trajet/favorites")
            .set("Authorization", `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(favs);
    });

    test("401 — sans token", async () => {
        const res = await request(app).get("/api/trajet/favorites");
        expect(res.status).toBe(401);
    });

    test("500 — erreur base de données", async () => {
        FavoriteItinary.findAll.mockRejectedValue(new Error("DB fail"));

        const res = await request(app)
            .get("/api/trajet/favorites")
            .set("Authorization", `Bearer ${makeToken()}`);

        expect(res.status).toBe(500);
    });
});

describe("POST /api/trajet/favorites", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "secret_key";
    });

    test("201 — crée un favori", async () => {
        FavoriteItinary.findOne.mockResolvedValue(null);
        FavoriteItinary.create.mockResolvedValue({
            favorites_itinary_id: 1,
            gare_depart: "Paris",
            gare_arrivee: "Lyon",
        });

        const res = await request(app)
            .post("/api/trajet/favorites")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ gare_depart: "Paris", gare_arrivee: "Lyon" });

        expect(res.status).toBe(201);
        expect(res.body.gare_depart).toBe("Paris");
    });

    test("400 — corps incomplet (pas de gare_arrivee)", async () => {
        const res = await request(app)
            .post("/api/trajet/favorites")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ gare_depart: "Paris" });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/requis/);
    });

    test("409 — favori déjà existant", async () => {
        FavoriteItinary.findOne.mockResolvedValue({ favorites_itinary_id: 1 });

        const res = await request(app)
            .post("/api/trajet/favorites")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ gare_depart: "Paris", gare_arrivee: "Lyon" });

        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/favoris/);
    });

    test("401 — sans token", async () => {
        const res = await request(app)
            .post("/api/trajet/favorites")
            .send({ gare_depart: "Paris", gare_arrivee: "Lyon" });

        expect(res.status).toBe(401);
    });
});

describe("DELETE /api/trajet/favorites/:id", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "secret_key";
    });

    test("200 — supprime le favori", async () => {
        FavoriteItinary.destroy.mockResolvedValue(1);

        const res = await request(app)
            .delete("/api/trajet/favorites/1")
            .set("Authorization", `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Favori supprimé");
    });

    test("404 — favori introuvable", async () => {
        FavoriteItinary.destroy.mockResolvedValue(0);

        const res = await request(app)
            .delete("/api/trajet/favorites/999")
            .set("Authorization", `Bearer ${makeToken()}`);

        expect(res.status).toBe(404);
    });

    test("401 — sans token", async () => {
        const res = await request(app).delete("/api/trajet/favorites/1");
        expect(res.status).toBe(401);
    });
});

describe("GET /api/trajet/history", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "secret_key";
    });

    test("200 — retourne l'historique de l'utilisateur", async () => {
        const history = [
            { history_id: 1, gare_depart: "Paris", gare_arrivee: "Bordeaux" },
        ];
        SearchHistory.findAll.mockResolvedValue(history);

        const res = await request(app)
            .get("/api/trajet/history")
            .set("Authorization", `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(history);
    });

    test("401 — sans token", async () => {
        const res = await request(app).get("/api/trajet/history");
        expect(res.status).toBe(401);
    });
});

describe("POST /api/trajet/history", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "secret_key";
    });

    test("201 — sauvegarde une entrée d'historique", async () => {
        SearchHistory.create.mockResolvedValue({
            history_id: 1,
            gare_depart: "Paris",
            gare_arrivee: "Marseille",
        });

        const res = await request(app)
            .post("/api/trajet/history")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({
                gare_depart: "Paris",
                gare_arrivee: "Marseille",
                date_recherche: "2024-06-01",
                duree: "3h12",
                co2_economise: 42.5,
                prix: 79,
            });

        expect(res.status).toBe(201);
        expect(res.body.gare_depart).toBe("Paris");
    });

    test("400 — gare_depart manquant", async () => {
        const res = await request(app)
            .post("/api/trajet/history")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ gare_arrivee: "Marseille" });

        expect(res.status).toBe(400);
    });

    test("stocke les métadonnées au format JSON", async () => {
        let captured;
        SearchHistory.create.mockImplementation((data) => {
            captured = data;
            return Promise.resolve({ ...data, history_id: 1 });
        });

        await request(app)
            .post("/api/trajet/history")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({
                gare_depart: "Paris",
                gare_arrivee: "Lyon",
                duree: "2h00",
                co2_economise: 20,
                prix: 55,
            });

        expect(typeof captured.type_train).toBe("string");
        const parsed = JSON.parse(captured.type_train);
        expect(parsed.duree).toBe("2h00");
        expect(parsed.prix).toBe(55);
    });
});
