const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ArchivedDirectMessage =
    sequelize.define(
        "ArchivedDirectMessage",
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
                allowNull: true
            },

            messageType: {
                type: DataTypes.ENUM(
                    "text",
                    "image",
                    "file",
                    "video",
                    "audio"
                ),
                allowNull: false,
                defaultValue: "text"
            },

            mediaKey: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            mediaUrl: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            mediaName: {
                type: DataTypes.STRING,
                allowNull: true
            },

            mediaSize: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            mimeType: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            tableName: "archived_direct_messages",
            timestamps: true,

            indexes: [
                {
                    fields: [
                        "senderId",
                        "receiverId",
                        "createdAt"
                    ]
                },
                {
                    fields: [
                        "receiverId",
                        "senderId",
                        "createdAt"
                    ]
                }
            ]
        }
    );

module.exports =
    ArchivedDirectMessage;