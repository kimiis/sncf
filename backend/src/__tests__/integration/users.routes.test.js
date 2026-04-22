/**
 * Tests d'intégration — Routes utilisateurs (/api/users)
 *
 * IMPORTANT : Les routes /api/users n'ont PAS de verifyToken par défaut.
 * Seule /api/users (GET all) est publique dans l'implémentation actuelle.
 * Les routes modifiant les données utilisent /api/users/user/:id.
 */
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("express-rate-limit", () => () => (req, res, next) => next());
jest.mock("morgan", () => () => (req, res, next) => next());
jest.mock("../../services/UserService", () => ({
    getAllUsersService: jest.fn(),
    getUserByIdService: jest.fn(),
    createUser: jest.fn(),
    patchUserService: jest.fn(),
    deleteUserService: jest.fn(),
}));
jest.mock("../../middlewares/multer", () => ({
    single: () => (req, res, next) => next(),
}));

const userService = require("../../services/UserService");
const app = require("../../app");

process.env.JWT_SECRET = "secret_key";

const mockUser = {
    user_id: "uuid-1",
    first_name: "Alice",
    last_name: "Dupont",
    email: "alice@example.com",
};

describe("GET /api/users", () => {
    beforeEach(() => jest.clearAllMocks());

    test("200 — retourne tous les utilisateurs (route publique)", async () => {
        userService.getAllUsersService.mockResolvedValue([mockUser]);

        const res = await request(app).get("/api/users");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].email).toBe("alice@example.com");
    });

    test("500 — erreur interne du serveur", async () => {
        userService.getAllUsersService.mockRejectedValue(new Error("DB fail"));

        const res = await request(app).get("/api/users");

        expect(res.status).toBe(500);
    });
});

describe("GET /api/users/:id", () => {
    beforeEach(() => jest.clearAllMocks());

    test("200 — retourne l'utilisateur correspondant", async () => {
        userService.getUserByIdService.mockResolvedValue(mockUser);

        const res = await request(app).get("/api/users/uuid-1");

        expect(res.status).toBe(200);
        expect(res.body.email).toBe("alice@example.com");
    });

    test("404 — utilisateur inexistant", async () => {
        userService.getUserByIdService.mockResolvedValue(null);

        const res = await request(app).get("/api/users/inexistant");

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Utilisateur non trouvé");
    });

    test("500 — erreur interne", async () => {
        userService.getUserByIdService.mockRejectedValue(new Error("DB fail"));

        const res = await request(app).get("/api/users/uuid-1");

        expect(res.status).toBe(500);
    });
});

describe("POST /api/users", () => {
    beforeEach(() => jest.clearAllMocks());

    test("201 — crée un nouvel utilisateur", async () => {
        userService.createUser.mockResolvedValue(mockUser);

        const res = await request(app)
            .post("/api/users")
            .send({
                first_name: "Alice",
                last_name: "Dupont",
                email: "alice@example.com",
                password: "secret",
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/créé/);
    });

    test("500 — erreur lors de la création", async () => {
        userService.createUser.mockRejectedValue(new Error("Email déjà utilisé."));

        const res = await request(app)
            .post("/api/users")
            .send({ email: "alice@example.com", password: "secret" });

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/Email déjà utilisé/);
    });
});

describe("PATCH /api/users/user/:id", () => {
    beforeEach(() => jest.clearAllMocks());

    test("200 — met à jour partiellement un utilisateur", async () => {
        userService.patchUserService.mockResolvedValue({ ...mockUser, first_name: "Alicia" });

        const res = await request(app)
            .patch("/api/users/user/uuid-1")
            .send({ first_name: "Alicia" });

        expect(res.status).toBe(200);
        expect(res.body.first_name).toBe("Alicia");
    });

    test("500 — utilisateur introuvable", async () => {
        userService.patchUserService.mockRejectedValue(
            new Error("Erreur lors de la mise à jour partielle de l'utilisateur.")
        );

        const res = await request(app)
            .patch("/api/users/user/bad-id")
            .send({ first_name: "Alicia" });

        expect(res.status).toBe(500);
    });
});

describe("DELETE /api/users/user/:id", () => {
    beforeEach(() => jest.clearAllMocks());

    test("200 — supprime l'utilisateur", async () => {
        userService.deleteUserService.mockResolvedValue({ message: "Utilisateur supprimé avec succès." });

        const res = await request(app).delete("/api/users/user/uuid-1");

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/supprimé/);
    });

    test("500 — utilisateur introuvable", async () => {
        userService.deleteUserService.mockRejectedValue(
            new Error("Erreur lors de la suppression de l'utilisateur.")
        );

        const res = await request(app).delete("/api/users/user/bad-id");

        expect(res.status).toBe(500);
    });
});
