const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const DirectMessage = sequelize.define(
  "DirectMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    messageType: {
      type: DataTypes.ENUM("text", "image", "file", "video", "audio"),
      allowNull: false,
      defaultValue: "text",
    },

    mediaKey: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    mediaUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    mediaName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    mediaSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "direct_messages",
    timestamps: true,
    indexes: [
      {
        name: "idx_dm_sender_receiver_created",
        fields: ["senderId", "receiverId", "createdAt"],
      },
      {
        name: "idx_dm_receiver_sender_created",
        fields: ["receiverId", "senderId", "createdAt"],
      },
    ],
  },
);

module.exports = DirectMessage;
