const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Message = sequelize.define(
  "Message",
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

    groupId: {
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
    tableName: "messages",
    timestamps: true,
    indexes: [
      {
        name: "idx_messages_group_created",
        fields: ["groupId", "createdAt"],
      },
      {
        name: "idx_messages_sender",
        fields: ["senderId"],
      },
    ],
  },
);

module.exports = Message;
