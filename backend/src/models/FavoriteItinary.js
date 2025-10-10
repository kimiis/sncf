const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/Database");

const User = require("./UserModel");

const FavoriteItinary = sequelize.define("FavoriteItinary", {
    favorites_itinary_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gare_depart: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    gare_arrivee: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "favorites_itinary",
    timestamps: false,
});

User.hasMany(FavoriteItinary, { foreignKey: "user_id", onDelete: "CASCADE" });
FavoriteItinary.belongsTo(User, { foreignKey: "user_id" });

module.exports = FavoriteItinary;
