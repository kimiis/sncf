const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/Database");
const User = require("./UserModel");

const SearchHistory = sequelize.define("SearchHistory", {
    search_history_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gare_depart: DataTypes.STRING(100),
    gare_arrivee: DataTypes.STRING(100),
    date_recherche: DataTypes.DATEONLY,
    type_train: DataTypes.TEXT,
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "search_history",
    timestamps: false,
});

User.hasMany(SearchHistory, { foreignKey: "user_id", onDelete: "CASCADE" });
SearchHistory.belongsTo(User, { foreignKey: "user_id" });

module.exports = SearchHistory;
