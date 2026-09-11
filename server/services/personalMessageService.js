const { Op } = require("sequelize")
const DirectMessage = require("../models/DirectMessage");
const User = require("../models/User");

/*
    Send a personal message
*/
const sendPersonalMessage = async ({
    senderId,
    receiverId,
    content
}) => {

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
        throw new Error(
            "Receiver does not exist"
        );
    }

    const message = await DirectMessage.create({
        senderId,
        receiverId,
        content
    });

    /*
        Fetch the message again with
        sender and receiver information.
    */

    const messageWithUsers =
        await DirectMessage.findByPk(
            message.id,
            {
                include: [
                    {
                        model: User,
                        as: "sender",
                        attributes: ["id", "name"]
                    },
                    {
                        model: User,
                        as: "receiver",
                        attributes: ["id", "name"]
                    }
                ]
            }
        );

    return messageWithUsers;
};


/*
    Get conversation between
    current user and another user
*/
const getPersonalMessages = async (
    userId,
    otherUserId
) => {

    const messages =
        await DirectMessage.findAll({

            where: {
                [Op.or]: [
                    {
                        senderId: userId,
                        receiverId: otherUserId
                    },
                    {
                        senderId: otherUserId,
                        receiverId: userId
                    }
                ]
            },

            include: [
                {
                    model: User,
                    as: "sender",
                    attributes: ["id", "name"]
                },
                {
                    model: User,
                    as: "receiver",
                    attributes: ["id", "name"]
                }
            ],

            order: [
                ["createdAt", "ASC"]
            ]
        });

    return messages;
};


module.exports = {
    sendPersonalMessage,
    getPersonalMessages
};