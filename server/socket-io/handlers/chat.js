const messageService = require("../../services/messageService");
const GroupMember = require("../../models/GroupMember");

const registerChatHandlers = (io, socket) => {

    socket.on("join_group", async (groupId) => {
        try {

            if (!groupId) {
                return;
            }

            const userId = socket.user.id;

            const membership =
                await GroupMember.findOne({
                    where: {
                        groupId,
                        userId
                    }
                });

            if (!membership) {

                console.log(
                    `User ${userId} attempted to join group ${groupId} without membership`
                );

                socket.emit("group_room_error", {
                    groupId,
                    message:
                        "You are not a member of this group"
                });

                return;
            }

            const roomName = `group_${groupId}`;

            socket.join(roomName);

            console.log(
                `User ${userId} joined ${roomName}`
            );

        } catch (error) {

            console.error(
                "Failed to join group:",
                error
            );

            socket.emit("group_room_error", {
                groupId,
                message:
                    "Failed to join group"
            });
        }
    });

    socket.on("leave_group", (groupId) => {
        const roomName = `group_${groupId}`;

        socket.leave(roomName);

        console.log(
            `User ${socket.user.id} left ${roomName}`
        );
    });

    socket.on(
        "send_message",
        async ({ groupId, content }) => {

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

                if (
                    error.message ===
                    "You are not a member of this group"
                ) {
                    socket.emit("group_message_error", {
                        groupId,
                        message: error.message
                    });

                    return;
                }

                socket.emit("message_error", {
                    message:
                        "Failed to send message"
                });
            }
        }
    );

};

module.exports = registerChatHandlers;