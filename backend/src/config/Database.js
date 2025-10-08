require('dotenv').config();
const { Sequelize } = require('sequelize');

//variables d'environnement
const DB_NAME = process.env.DB_NAME || 'sncf';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASS = process.env.DB_PASS || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_SSL  = process.env.DB_SSL === 'true';

const isTest = process.env.NODE_ENV === 'test';

// Configuration de Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: isTest ? false : console.log, // désactive les logs en test
    pool: {
        max: 10,
        min: 0,
        idle: 10000,
    },
    dialectOptions: DB_SSL
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : undefined,
});

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
