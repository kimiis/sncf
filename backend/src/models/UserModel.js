const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User_model = sequelize.define("User", {
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

module.exports = User_model;
