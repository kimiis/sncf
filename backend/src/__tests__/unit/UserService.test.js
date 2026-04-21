// Mocks avec factories explicites pour éviter le chargement des modèles Sequelize
jest.mock("../../repositories/UserRepository", () => ({
    getAllUsersRepository: jest.fn(),
    getUserByIdRepository: jest.fn(),
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    patchUserRepository: jest.fn(),
    deleteUserRepository: jest.fn(),
}));

jest.mock("../../repositories/RoleRepository", () => ({
    getRoleIdByName: jest.fn(),
    getRoleById: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

const userRepository = require("../../repositories/UserRepository");
const roleRepository = require("../../repositories/RoleRepository");
const bcrypt = require("bcryptjs");
const userService = require("../../services/UserService");

describe("UserService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── getAllUsersService ────────────────────────────────────────────────────

    describe("getAllUsersService", () => {
        test("retourne la liste des utilisateurs", async () => {
            const users = [{ user_id: "1", email: "a@b.com" }];
            userRepository.getAllUsersRepository.mockResolvedValue(users);

            const result = await userService.getAllUsersService();

            expect(result).toEqual(users);
            expect(userRepository.getAllUsersRepository).toHaveBeenCalledTimes(1);
        });

        test("propage les erreurs du repository", async () => {
            userRepository.getAllUsersRepository.mockRejectedValue(new Error("DB Error"));

            await expect(userService.getAllUsersService()).rejects.toThrow("DB Error");
        });
    });

    // ─── getUserByIdService ───────────────────────────────────────────────────

    describe("getUserByIdService", () => {
        test("retourne null si l'utilisateur n'existe pas", async () => {
            userRepository.getUserByIdRepository.mockResolvedValue(null);

            const result = await userService.getUserByIdService("uuid-inexistant");

            expect(result).toBeNull();
        });

        test("retourne l'utilisateur avec les notes triées par date décroissante", async () => {
            const mockUser = {
                user_id: "uuid-1",
                notes_received: [
                    { created_at: "2024-01-01" },
                    { created_at: "2024-03-01" },
                    { created_at: "2024-02-01" },
                ],
            };
            userRepository.getUserByIdRepository.mockResolvedValue(mockUser);

            const result = await userService.getUserByIdService("uuid-1");

            expect(result.notes_received[0].created_at).toBe("2024-03-01");
            expect(result.notes_received[2].created_at).toBe("2024-01-01");
        });

        test("retourne l'utilisateur même sans notes_received", async () => {
            const mockUser = { user_id: "uuid-1", email: "x@x.com" };
            userRepository.getUserByIdRepository.mockResolvedValue(mockUser);

            const result = await userService.getUserByIdService("uuid-1");

            expect(result).toEqual(mockUser);
        });
    });

    // ─── createUser ───────────────────────────────────────────────────────────

    describe("createUser", () => {
        const validData = {
            first_name: "Alice",
            last_name: "Dupont",
            email: "alice@example.com",
            password: "secret123",
            civilite: "Mme",
            phone: "0600000000",
            address: "1 rue de la Paix",
            date_of_birth: "1990-01-01",
            photo_url: null,
        };

        test("crée un utilisateur avec le rôle 'user' par défaut", async () => {
            roleRepository.getRoleIdByName.mockResolvedValue(2);
            roleRepository.getRoleById.mockResolvedValue({ name: "user" });
            bcrypt.hash.mockResolvedValue("$2b$10$hashed");
            userRepository.createUser.mockResolvedValue({ user_id: "new-uuid", ...validData });

            const result = await userService.createUser(validData);

            expect(roleRepository.getRoleIdByName).toHaveBeenCalledWith("user");
            expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10);
            expect(userRepository.createUser).toHaveBeenCalledWith(
                expect.objectContaining({ password: "$2b$10$hashed" })
            );
            expect(result.user_id).toBe("new-uuid");
        });

        test("utilise le role_id fourni s'il est précisé", async () => {
            roleRepository.getRoleById.mockResolvedValue({ name: "admin" });
            bcrypt.hash.mockResolvedValue("$2b$10$hashed");
            userRepository.createUser.mockResolvedValue({ user_id: "admin-uuid" });

            await userService.createUser({ ...validData, role_id: 1 });

            expect(roleRepository.getRoleIdByName).not.toHaveBeenCalled();
            expect(roleRepository.getRoleById).toHaveBeenCalledWith(1);
        });

        test("lève une erreur si le rôle est introuvable", async () => {
            roleRepository.getRoleIdByName.mockResolvedValue(99);
            roleRepository.getRoleById.mockResolvedValue(null);

            await expect(userService.createUser(validData)).rejects.toThrow(
                "Rôle avec l'ID 99 introuvable."
            );
        });

        test("génère un mot de passe aléatoire si aucun n'est fourni", async () => {
            roleRepository.getRoleIdByName.mockResolvedValue(2);
            roleRepository.getRoleById.mockResolvedValue({ name: "user" });
            bcrypt.hash.mockResolvedValue("$2b$10$random");
            userRepository.createUser.mockResolvedValue({ user_id: "uuid" });

            const { password: _, ...dataWithoutPass } = validData;
            await userService.createUser(dataWithoutPass);

            // bcrypt.hash doit être appelé avec un string généré automatiquement
            expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
        });
    });

    // ─── patchUserService ─────────────────────────────────────────────────────

    describe("patchUserService", () => {
        test("appelle le repository avec les bons arguments", async () => {
            const updated = { email: "new@mail.com" };
            userRepository.patchUserRepository.mockResolvedValue({ user_id: "1", ...updated });

            const result = await userService.patchUserService("1", updated);

            expect(userRepository.patchUserRepository).toHaveBeenCalledWith("1", updated);
            expect(result.email).toBe("new@mail.com");
        });

        test("propage les erreurs en tant que Error avec message générique", async () => {
            userRepository.patchUserRepository.mockRejectedValue(new Error("DB fail"));

            await expect(userService.patchUserService("1", {})).rejects.toThrow(
                "Erreur lors de la mise à jour partielle de l'utilisateur."
            );
        });
    });

    // ─── deleteUserService ────────────────────────────────────────────────────

    describe("deleteUserService", () => {
        test("appelle le repository et retourne le résultat", async () => {
            userRepository.deleteUserRepository.mockResolvedValue({ message: "Utilisateur supprimé avec succès." });

            const result = await userService.deleteUserService("uuid-1");

            expect(result.message).toMatch(/supprimé/);
        });

        test("propage les erreurs avec un message générique", async () => {
            userRepository.deleteUserRepository.mockRejectedValue(new Error("DB fail"));

            await expect(userService.deleteUserService("bad-id")).rejects.toThrow(
                "Erreur lors de la suppression de l'utilisateur."
            );
        });
    });
});
