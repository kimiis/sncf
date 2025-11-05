const RoleModel = require("../models/RoleModel");

class RoleRepository {
    // Récupérer un rôle par son nom
    async getRoleIdByName(name) {
        try {
            const role = await RoleModel.findOne({ where: { name } });
            return role ? role.role_id : null;
        } catch (error) {
            console.error("Erreur dans getRoleIdByName :", error);
            throw error;
        }
    }

    // Récupérer un rôle par son ID
    async getRoleById(role_id) {
        try {
            return await RoleModel.findByPk(role_id);
        } catch (error) {
            console.error("Erreur dans getRoleById :", error);
            throw error;
        }
    }

    // Récupérer tous les rôles
    async getAllRoles() {
        try {
            return await RoleModel.findAll();
        } catch (error) {
            console.error("Erreur dans getAllRoles :", error);
            throw error;
        }
    }
}

module.exports = new RoleRepository();
