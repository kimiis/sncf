const AuthService = require("../services/AuthService");

const AuthController = {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.json(result);
        } catch (error) {
            console.error("Erreur login :", error);
            res.status(error.status || 500).json({
                message: error.message || "Erreur serveur lors de la connexion.",
            });
        }
    },
};

module.exports = AuthController;
