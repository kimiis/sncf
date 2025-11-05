const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const Role = require("../models/RoleModel");
const { Op, Sequelize } = require("sequelize");
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class UserRepository {

    //Fonction pour récuperer tous les users dans la BDD
    async getAllUsersRepository() {
        try {
            const userList  = await User.findAll();
            //console.log("Utilisateurs récupérés:", users);
            return userList ;
        } catch (error) {
            //console.error("Erreur Sequelize:", error);
            throw error; // Propage l'erreur au service
        }
    }

    //Fonction pour récuperer tous les infos d'un user
    async getUserByIdRepository(user_id) {
        const user = await User.findOne({
            where: { user_id },
            attributes: [
                'civilite',
                'user_id',
                'first_name',
                'last_name',
                'address',
                'phone',
                'date_of_birth',
                'email',
                'createdAt',
                'photo_url',
            ],
            include: [
                {
                    model: Role,
                    as: "roles",
                    attributes: ["role_name"]
                },
            ]
        });

        return user;
    }

    //Fonction pour retrouver un user via son email
    async findByEmail(email) {
        return User.findOne({ where: { email } });
    }
    //Fonction pour créer un user
    async createUser(data) {
        return User.create(data);
    }
    //Fonction pour mettre à jour le user
    async updateUserRepository(user_id, updatedData) {
        try {
            // console.log("Mise à jour de l'utilisateur ID :", user_id);

            const user = await User.findOne({ where: { user_id } });
            if (!user) {
                throw new Error(`Utilisateur avec l'ID ${user_id} introuvable.`);
            }

            await user.update(updatedData);
            //console.log("Utilisateur mis à jour :", user);
            return user;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
            throw new Error("Erreur lors de la mise à jour de l'utilisateur.");
        }
    }

    //Fonction pour mettre à jour partiellement le user
    async patchUserRepository(user_id, updatedFields) {
        try {
            //console.log("Mise à jour partielle de l'utilisateur ID :", user_id);

            const user = await User.findOne({ where: { user_id } });
            if (!user) {
                throw new Error(`Utilisateur avec l'ID ${user_id} introuvable.`);
            }

            await user.update(updatedFields);
            //console.log("Mise à jour partielle réussie :", user);
            return user;
        } catch (error) {
            console.error("Erreur lors de la mise à jour partielle de l'utilisateur :", error);
            throw new Error("Erreur lors de la mise à jour partielle de l'utilisateur.");
        }
    }

    //Fonction pour supprimer un user
    async deleteUserRepository(user_id) {
        try {
            //console.log("Suppression de l'utilisateur ID :", user_id);

            const user = await User.findOne({ where: { user_id } });
            if (!user) {
                throw new Error(`Utilisateur avec l'ID ${user_id} introuvable.`);
            }

            await user.destroy();
            //console.log("Utilisateur supprimé avec succès.");
            return { message: "Utilisateur supprimé avec succès." };
        } catch (error) {
            console.error("Erreur lors de la suppression de l'utilisateur :", error);
            throw new Error("Erreur lors de la suppression de l'utilisateur.");
        }
    }

    // Fonction pour récupérer toutes les infos du user avec son rôle
    async getUserWithRoles(userId) {
        try {
            const user = await User.findOne({
                where: { user_id: userId },
                attributes: { exclude: ["password", "email"] },
                include: [
                    {
                        model: Role,
                        attributes: ["role_id", "role_name"],
                        through: { attributes: [] },
                        required: true,
                    }
                ],
                logging: console.log
            });

            console.log(" Utilisateur récupéré avec rôles :", JSON.stringify(user, null, 2));

            return user;
        } catch (error) {
            console.error(" Erreur Sequelize lors de la récupération de l'utilisateur avec rôles :", error);
            throw new Error("Erreur lors de la récupération de l'utilisateur avec ses rôles.");
        }
    }

}

module.exports = new UserRepository();
