const { Server } = require("socket.io");

const {
    getAllGroupIds
} = require("../services/groupService")

const authenticateSocket =
    require("./middleware");

const registerChatHandlers =
    require("./handlers/chat");

const registerPersonalChatHandlers =
    require("./handlers/personalChat");

const initializeSocket = (server) => {

    const io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    io.use(authenticateSocket);

    io.on("connection", async (socket) => {

    console.log(
        "User connected:",
        socket.id
    );

    console.log(
        "Authenticated user:",
        socket.user
    );

    try {

        const groupIds =
            await getAllGroupIds();

        groupIds.forEach((groupId) => {

            socket.join(
                `group_${groupId}`
            );

        });

        console.log(
            `User ${socket.user.id} joined all group rooms`
        );

    } catch (error) {

        console.error(
            "Failed to join group rooms:",
            error
        );

    }

    registerChatHandlers(
        io,
        socket
    );

    registerPersonalChatHandlers(
    io,
    socket
    );

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