const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Mock des dépendances AVANT le require du service
jest.mock("../../repositories/UserRepository");
jest.mock("../../repositories/RoleRepository");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const UserRepository = require("../../repositories/UserRepository");
const RoleRepository = require("../../repositories/RoleRepository");
const AuthService = require("../../services/AuthService");

describe("AuthService.login", () => {
    const mockUser = {
        user_id: "uuid-123",
        email: "alice@example.com",
        password: "$2b$10$hashedpassword",
        first_name: "Alice",
        last_name: "Dupont",
        role_id: 1,
    };

    const mockRole = { name: "user" };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test_secret";
    });

    test("retourne un token si les identifiants sont corrects", async () => {
        UserRepository.findByEmail.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        RoleRepository.getRoleById.mockResolvedValue(mockRole);
        jwt.sign.mockReturnValue("fake.jwt.token");

        const result = await AuthService.login("alice@example.com", "password123");

        expect(result.token).toBe("fake.jwt.token");
        expect(result.message).toBe("Connexion réussie");
        expect(result.user.email).toBe("alice@example.com");
        expect(result.user.role).toBe("user");
    });

    test("lève une erreur 404 si l'utilisateur n'existe pas", async () => {
        UserRepository.findByEmail.mockResolvedValue(null);

        await expect(AuthService.login("inconnu@example.com", "pass")).rejects.toMatchObject({
            status: 404,
            message: "Utilisateur introuvable.",
        });
    });

    test("lève une erreur 401 si le mot de passe est incorrect", async () => {
        UserRepository.findByEmail.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        await expect(AuthService.login("alice@example.com", "mauvais")).rejects.toMatchObject({
            status: 401,
            message: "Mot de passe incorrect.",
        });
    });

    test("appelle UserRepository.findByEmail avec le bon email", async () => {
        UserRepository.findByEmail.mockResolvedValue(null);

        await AuthService.login("test@test.com", "pass").catch(() => {});

        expect(UserRepository.findByEmail).toHaveBeenCalledWith("test@test.com");
    });

    test("génère un JWT avec id, email et role", async () => {
        UserRepository.findByEmail.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        RoleRepository.getRoleById.mockResolvedValue(mockRole);
        jwt.sign.mockReturnValue("token");

        await AuthService.login("alice@example.com", "password123");

        expect(jwt.sign).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "uuid-123",
                email: "alice@example.com",
                role: "user",
            }),
            "test_secret",
            { expiresIn: "24h" }
        );
    });

    test("fonctionne avec un rôle null (pas de rôle assigné)", async () => {
        UserRepository.findByEmail.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        RoleRepository.getRoleById.mockResolvedValue(null);
        jwt.sign.mockReturnValue("token");

        const result = await AuthService.login("alice@example.com", "pass");

        expect(result.user.role).toBeUndefined();
    });
});
