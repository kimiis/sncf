const sequelize = require("../config/Database");
const Role = require("./RoleModel");
const User = require("./UserModel");
const FavoriteItinary = require("./FavoriteItinary");
const FavoriteGare = require("./FavoriteGare");
const SearchHistory = require("./SearchHistory");

module.exports = {
    sequelize,
    Role,
    User,
    FavoriteItinary,
    FavoriteGare,
    SearchHistory,
};
