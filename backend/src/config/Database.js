require('dotenv').config();
const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';
const DB_SSL  = process.env.DB_SSL !== 'false'; // SSL activé par défaut en prod

// Railway fournit DATABASE_URL, sinon on utilise les variables séparées
const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: isTest ? false : console.log,
        pool: { max: 10, min: 0, idle: 10000 },
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    })
    : new Sequelize(
        process.env.DB_NAME || 'sncf',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASS || '',
        {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 5432),
            dialect: 'postgres',
            logging: isTest ? false : console.log,
            pool: { max: 10, min: 0, idle: 10000 },
            dialectOptions: DB_SSL
                ? { ssl: { require: true, rejectUnauthorized: false } }
                : undefined,
        }
    );

/**
 * Initialise la connexion à la base
 * - En test : force la recréation des tables
 * - En dev/prod : garde les données existantes
 */
async function initDatabase({ sync = true } = {}) {
    try {
        await sequelize.authenticate();
        console.log('Connexion à la base réussie.');

        if (sync) {
            await sequelize.sync({ force: isTest });
            console.log('Synchronisation des modèles terminée.');
        }
    } catch (error) {
        console.error('Erreur de connexion à la base :', error);
        process.exit(1);
    }
}

/**
 * Ferme proprement la connexion
 */
async function closeDatabase() {
    await sequelize.close();
    console.log('Connexion à la base fermée.');
}

module.exports = { sequelize, initDatabase, closeDatabase };
