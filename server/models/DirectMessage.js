const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const DirectMessage = sequelize.define(
    "DirectMessage",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        receiverId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        content: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    },
    {
        tableName: "direct_messages",
        timestamps: true
    }
);

module.exports = DirectMessage;