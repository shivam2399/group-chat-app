const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Message = sequelize.define(
    "Message",
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

        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        content: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    },
    {
        tableName: "messages",
        timestamps: true
    }
);

module.exports = Message;