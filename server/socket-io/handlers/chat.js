const messageService = require("../../services/messageService");

const registerChatHandlers = (io, socket) => {

    socket.on("join_group", (groupId) => {
        const roomName = `group_${groupId}`;

        socket.join(roomName);

        console.log(
            `User ${socket.user.id} joined ${roomName}`
        );
    });

    socket.on("leave_group", (groupId) => {
        const roomName = `group_${groupId}`;

        socket.leave(roomName);

        console.log(
            `User ${socket.user.id} left ${roomName}`
        );
    });

    socket.on("send_message", async ({ groupId, content }) => {
    try {
        if (!groupId || !content?.trim()) {
            return;
        }

        const message =
            await messageService.createMessage({
                senderId: socket.user.id,
                groupId,
                content: content.trim()
            });

        io.to(`group_${groupId}`).emit(
            "new_message",
            message
        );

    } catch (error) {
        console.error(
            "Failed to send socket message:",
            error
        );

        socket.emit("message_error", {
            message: "Failed to send message"
        });
    }
});

};

module.exports = registerChatHandlers;