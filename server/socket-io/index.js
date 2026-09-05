const { Server } = require("socket.io");

const authenticateSocket =
    require("./middleware");

const registerChatHandlers =
    require("./handlers/chat");

const initializeSocket = (server) => {

    const io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    io.use(authenticateSocket);

    io.on("connection", (socket) => {

        console.log(
            "User connected:",
            socket.id
        );

        console.log(
            "Authenticated user:",
            socket.user
        );

        registerChatHandlers(io, socket);

        socket.on("disconnect", () => {
            console.log(
                "User disconnected:",
                socket.id
            );
        });

    });

    return io;
};

module.exports = initializeSocket;