const { Server } = require("socket.io");

const GroupMember = require("../models/GroupMember");
const authenticateSocket = require("./middleware");

const registerChatHandlers = require("./handlers/chat");

const registerPersonalChatHandlers = require("./handlers/personalChat");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "*",
    },
  });

  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    console.log("Authenticated user:", socket.user);

    try {
      // 1. Join dedicated personal notification room for 1-on-1 chats & alerts
      const userRoom = `user_${socket.user.id}`;
      socket.join(userRoom);

      // 2. Join only groups the authenticated user is an active member of
      const memberships = await GroupMember.findAll({
        where: {
          userId: socket.user.id,
        },
        attributes: ["groupId"],
      });

      memberships.forEach((membership) => {
        socket.join(`group_${membership.groupId}`);
      });

      console.log(
        `User ${socket.user.id} joined personal room and ${memberships.length} authorized group room(s)`,
      );
    } catch (error) {
      console.error("Failed to join authorized rooms:", error);
    }

    registerChatHandlers(io, socket);

    registerPersonalChatHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = initializeSocket;
