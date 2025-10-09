const userRepository = require("../repositories/UserRepository");
const roleRepository = require("../repositories/RoleRepository");
const User = require("../models/UserModel");
const Role = require("../models/RoleModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

class UserService {

    //Fonction pour appeler la fonction getAllUsersRepository dans le userRepository
    async getAllUsersService() {
        return await userRepository.getAllUsersRepository();
    }

    //Fonction pour appeler la fonction getUserByIDRepository dans le userRepository
    async getUserByIdService(user_id) {
        const user = await userRepository.getUserByIdRepository(user_id);

        if (!user) return null;

        if (Array.isArray(user.notes_received)) {
            user.notes_received.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return user;
    }

    //Fonction pour appeler la fonction createUserRepository dans le userRepository avec toutes les datas pour créer un client
    async createUser(userData) {
        const {
            civilite,
            first_name,
            last_name,
            email,
            phone,
            address,
            date_of_birth,
            password: rawPassword,
            photo_url,
            role_id: providedRoleId,
        } = userData;

        // Déterminer le rôle, si pas de rôle défini alors par défaut le rôle sera client
        const role_id = providedRoleId ?? (await roleRepository.getRoleIdByName("user"));
        const role = await roleRepository.getRoleById(role_id);
        if (!role) {
            throw new Error(`Rôle avec l'ID ${role_id} introuvable.`);
        }

        // Hashage du mot de passe, un client n'a pas de mdp alors que l'employé si
        const requiresPassword = ["admin", "user"].includes(role.role_name);
        const crypto = require("crypto");

        // Génère un mot de passe de 16 caractères aléatoires
        const generatedPassword = rawPassword || crypto.randomBytes(8).toString("hex");
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        if (requiresPassword && !rawPassword) {
            console.log("Mot de passe généré automatiquement :", generatedPassword);
        }

        // Création de l’utilisateur
        const newUser = await userRepository.createUser({
            civilite,
            first_name,
            last_name,
            email,
            phone,
            address,
            date_of_birth,
            password: hashedPassword,
            photo_url,
        });

        // Association au rôle
        await userRoleRepository.linkUserToRole(newUser.user_id, role_id);

        return newUser;
    }

    //Fonction pour appeler la fonction patchUserRepository dans le userRepository
    async patchUserService(user_id, updatedFields) {
        try {
            //console.log("Service - Mise à jour partielle utilisateur ID :", user_id);
            return await userRepository.patchUserRepository(user_id, updatedFields);
        } catch (error) {
            //console.error("Service - Erreur lors de la mise à jour partielle :", error);
            throw new Error("Erreur lors de la mise à jour partielle de l'utilisateur.");
        }
    }

    //Fonction pour appeler la fonction deleteUserRepository dans le userRepository
    async deleteUserService(user_id) {
        try {
            //console.log("Service - Suppression utilisateur ID :", user_id);
            return await userRepository.deleteUserRepository(user_id);
        } catch (error) {
            console.error("Service - Erreur lors de la suppression :", error);
            throw new Error("Erreur lors de la suppression de l'utilisateur.");
        }
    }

    //Fonction qui retourne le client suivant la recherche
    // async searchClients (searchTerm){
    //     if (!searchTerm) return [];
    //     return await userRepository.findClientsByLastName(searchTerm);
    // };
    //
    // //Fonction qui retourne l'employé suivant la recherche
    // async searchEmployee(searchTerm){
    //     if (!searchTerm || searchTerm.trim() === "") {
    //         // retourne tous les employés si search est vide
    //         return await userRepository.getAllEmployees();
    //     }
    //     return await userRepository.findEmployeeByFullName(searchTerm);
    // }
    //

}
module.exports = new UserService();