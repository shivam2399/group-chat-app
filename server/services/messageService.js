const Message = require("../models/Message");

const createMessage = async ({
    senderId,
    groupId,
    content
}) => {

    const message = await Message.create({
        senderId,
        groupId,
        content
    });

    return message;
};

module.exports = {
    createMessage
};