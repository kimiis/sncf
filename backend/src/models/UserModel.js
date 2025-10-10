const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/Database");

const Role = require("./RoleModel");

const User = sequelize.define("User", {
    user_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    last_name: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    first_name: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    address: DataTypes.STRING(50),
    postal_code: DataTypes.STRING(10),
    city: DataTypes.STRING(50),
    email: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    password: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    phone: DataTypes.STRING(25),
    date_of_birth: DataTypes.DATEONLY,
    photo_url: DataTypes.STRING(255),
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "users",
    timestamps: false,
});

Role.hasMany(User, { foreignKey: "role_id", onDelete: "SET NULL" });
User.belongsTo(Role, { foreignKey: "role_id" });

module.exports = User;
