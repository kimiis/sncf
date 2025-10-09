const Role = require("../models/RoleModel");

class RoleRepository {
    async getRoleById(role_id) {
        return await Role.findByPk(role_id);
    }

    async getAllRoles() {
        return await Role.findAll();
    }

    async getRoleIdByName(name) {
        const role = await Role.findOne({ where: { role_name: name } });
        return role ? role.role_id : null;
    }

}

module.exports = new RoleRepository();