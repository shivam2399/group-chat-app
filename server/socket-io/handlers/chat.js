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

};

module.exports = registerChatHandlers;