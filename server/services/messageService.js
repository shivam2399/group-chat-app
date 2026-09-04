const Message = require("../models/Message");
const User = require("../models/User");

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


const getMessagesByGroup = async (groupId) => {
    const messages = await Message.findAll({
        where: {
            groupId: groupId
        },
        include: [
            {
                model: User,
                as: "sender",
                attributes: ["id", "name"]
            }
        ],
        order: [["createdAt", "ASC"]]
    });

    return messages;
};


module.exports = {
    createMessage,
    getMessagesByGroup
};