const Message = require("../models/Message");
const User = require("../models/User");
const GroupMember = require("../models/GroupMember");

const createMessage = async ({
    senderId,
    groupId,
    content
}) => {

    const membership =
        await GroupMember.findOne({
            where: {
                groupId,
                userId: senderId
            }
        });

    if (!membership) {
        throw new Error(
            "You are not a member of this group"
        );
    }

    const message = await Message.create({
        senderId,
        groupId,
        content
    });

    const messageWithSender =
        await Message.findByPk(
            message.id,
            {
                include: [
                    {
                        model: User,
                        as: "sender",
                        attributes: ["id", "name"]
                    }
                ]
            }
        );

    return messageWithSender;
};


const getMessagesByGroup = async (
    groupId,
    userId
) => {

    const membership =
        await GroupMember.findOne({
            where: {
                groupId,
                userId
            }
        });

    if (!membership) {
        throw new Error(
            "You are not a member of this group"
        );
    }

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