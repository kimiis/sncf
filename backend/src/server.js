require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./config/Database");
const Role = require("./models/RoleModel");

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Connexion PostgreSQL réussie !");
        await sequelize.sync({ alter: true });
        console.log("Modèles synchronisés !");

        // Seed des rôles si absents
        await Role.findOrCreate({ where: { name: "user" } });
        await Role.findOrCreate({ where: { name: "admin" } });
        console.log("Rôles initialisés !");

        app.listen(PORT, () => console.log(`🚄 Serveur démarré sur le port ${PORT}`));
    } catch (error) {
        console.error("Erreur de connexion :", error);
    }
})();
