const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define("User", {
    user_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    civilite: {
        type: DataTypes.ENUM('M', 'Mme', 'Autre'),
        allowNull: false,
        defaultValue: 'Autre'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date_of_birth: {
        type: DataTypes.DATE,
        allowNull: false
    },
    photo_url: {
        type: DataTypes.STRING,
        allowNull: true
    },

}, {
    tableName: "users",
    timestamps: true,
    freezeTableName: true,
});

module.exports = User;
