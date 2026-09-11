const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Group = sequelize.define(
    "Group",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },
    {
        tableName: "groups",
        timestamps: true
    }
);

module.exports = Group;