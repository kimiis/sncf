const { DataTypes } = require("sequelize");
const sequelize = require("../config/Database");
const User = require("./UserModel");

const FavoriteGare = sequelize.define("FavoriteGare", {
    favorites_gare_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gare_code: DataTypes.STRING(8),
    gare_nom: DataTypes.STRING(50),
    region: DataTypes.STRING(50),
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "favorites_gares",
    timestamps: false,
});

User.hasMany(FavoriteGare, { foreignKey: "user_id", onDelete: "CASCADE" });
FavoriteGare.belongsTo(User, { foreignKey: "user_id" });

module.exports = FavoriteGare;
