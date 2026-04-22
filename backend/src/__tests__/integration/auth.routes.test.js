/**
 * Tests d'intégration — Routes d'authentification (/api/auth)
 * On mock AuthService pour éviter la base de données.
 */
const request = require("supertest");

jest.mock("../../services/AuthService");
// Mock du rate limiter pour ne pas bloquer les tests
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
// Mock de morgan pour éviter les logs
jest.mock("morgan", () => () => (req, res, next) => next());

const AuthService = require("../../services/AuthService");
const app = require("../../app");

describe("POST /api/auth/login", () => {
    beforeEach(() => jest.clearAllMocks());

    test("200 — retourne un token avec des identifiants valides", async () => {
        AuthService.login.mockResolvedValue({
            message: "Connexion réussie",
            token: "fake.jwt.token",
            user: { id: "uuid-1", email: "alice@example.com", role: "user" },
        });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "alice@example.com", password: "password123" });

        expect(res.status).toBe(200);
        expect(res.body.token).toBe("fake.jwt.token");
        expect(res.body.message).toBe("Connexion réussie");
    });

    test("404 — utilisateur introuvable", async () => {
        const err = new Error("Utilisateur introuvable.");
        err.status = 404;
        AuthService.login.mockRejectedValue(err);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "inconnu@example.com", password: "pass" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Utilisateur introuvable.");
    });

    test("401 — mot de passe incorrect", async () => {
        const err = new Error("Mot de passe incorrect.");
        err.status = 401;
        AuthService.login.mockRejectedValue(err);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "alice@example.com", password: "wrong" });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Mot de passe incorrect.");
    });

    test("500 — erreur serveur inattendue", async () => {
        AuthService.login.mockRejectedValue(new Error("DB crash"));

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "a@b.com", password: "pass" });

        expect(res.status).toBe(500);
    });

    test("retourne le bon Content-Type JSON", async () => {
        AuthService.login.mockResolvedValue({ message: "ok", token: "t", user: {} });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "a@b.com", password: "pass" });

        expect(res.headers["content-type"]).toMatch(/json/);
    });
});
