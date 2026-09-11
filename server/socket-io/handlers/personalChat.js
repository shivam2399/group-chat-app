const personalMessageService = require("../../services/personalMessageService");
const User = require("../../models/User");


const getPersonalRoom = (
    userId1,
    userId2
) => {

    const ids = [
        Number(userId1),
        Number(userId2)
    ].sort((a, b) => a - b);

    return `personal_${ids[0]}_${ids[1]}`;
};


const registerPersonalChatHandlers = (
    io,
    socket
) => {

    /* ==================== JOIN ROOM ==================== */

    socket.on(
        "join_room",
        async ({ userId }) => {

            try {

                if (!userId) {
                    return;
                }

                const currentUserId =
                    socket.user.id;

                // Verify that the other user exists
                const otherUser =
                    await User.findByPk(userId);

                if (!otherUser) {

                    console.log(
                        `User ${userId} does not exist`
                    );

                    socket.emit(
                        "personal_room_error",
                        {
                            message:
                                "User does not exist"
                        }
                    );

                    return;
                }

                // Prevent joining a room with yourself
                if (
                    Number(currentUserId) ===
                    Number(userId)
                ) {

                    socket.emit(
                        "personal_room_error",
                        {
                            message:
                                "You cannot start a chat with yourself"
                        }
                    );

                    return;
                }

                const roomName =
                    getPersonalRoom(
                        currentUserId,
                        userId
                    );

                socket.join(roomName);

                console.log(
                    "PERSONAL ROOM JOINED:",
                    {
                        currentUserId,
                        userId,
                        roomName,
                        socketId: socket.id
                    }
                );

            } catch (error) {

                console.error(
                    "Failed to join personal room:",
                    error
                );

                socket.emit(
                    "personal_room_error",
                    {
                        message:
                            "Failed to join personal chat"
                    }
                );
            }
        }
    );


    /* ==================== NEW MESSAGE ==================== */

    socket.on(
    "send_personal_message",
    async ({ receiverId, content }) => {

        try {

            console.log(
                "PERSONAL MESSAGE REQUEST:",
                {
                    receiverId,
                    content
                }
            );

            if (
                !receiverId ||
                !content?.trim()
            ) {
                return;
            }

            const senderId =
                socket.user.id;

            const cleanContent =
                content.trim();

            const message =
                await personalMessageService
                    .sendPersonalMessage({
                        senderId,
                        receiverId,
                        content: cleanContent
                    });

            console.log(
                "PERSONAL MESSAGE SAVED:",
                message
            );

            const roomName =
                getPersonalRoom(
                    senderId,
                    receiverId
                );

            io.to(roomName).emit(
                "new_personal_message",
                message
            );

            console.log(
                `Personal message sent: ${senderId} → ${receiverId}`
            );

        } catch (error) {

            console.error(
                "Failed to send personal message:",
                error
            );

            socket.emit(
                "personal_message_error",
                {
                    message:
                        "Failed to send personal message"
                }
            );
        }
    }
);
};


module.exports =
    registerPersonalChatHandlers;