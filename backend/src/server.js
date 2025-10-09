require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Connexion PostgreSQL réussie !");
        await sequelize.sync({ alter: true });
        console.log("Modèles synchronisés !");

        app.listen(PORT, () => console.log(`🚄 Serveur démarré sur le port ${PORT}`));
    } catch (error) {
        console.error("Erreur de connexion :", error);
    }
})();
