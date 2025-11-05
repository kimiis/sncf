const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/UserRepository");
const RoleRepository = require("../repositories/RoleRepository");

const AuthService = {
    async login(email, password) {
        // Vérifie si l'utilisateur existe
        const user = await UserRepository.findByEmail(email);
        if (!user) {
            const err = new Error("Utilisateur introuvable.");
            err.status = 404;
            throw err;
        }

        // Vérifie le mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            const err = new Error("Mot de passe incorrect.");
            err.status = 401;
            throw err;
        }

        // Récupère le rôle
        const role = await RoleRepository.getRoleById(user.role_id);

        // Génère un token JWT
        const token = jwt.sign(
            {
                id: user.user_id,
                email: user.email,
                role: role?.name,
            },
            process.env.JWT_SECRET || "secret_key",
            { expiresIn: "24h" }
        );

        // Structure du retour
        return {
            message: "Connexion réussie",
            token,
            user: {
                id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: role?.name,
            },
        };
    },
};

module.exports = AuthService;
