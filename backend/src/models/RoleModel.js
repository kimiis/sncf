const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/Database");

const RoleModel = sequelize.define("RoleModel", {
    role_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
    },
}, {
    tableName: "roles",
    timestamps: false,
});

module.exports = RoleModel;
