const { Op } = require("sequelize")
const DirectMessage = require("../models/DirectMessage");
const User = require("../models/User");
const { generatePresignedUrl } = require("./s3Service");

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

    const messagesWithSignedUrls =
        await Promise.all(
            messages.map(async (message) => {

                if (
                    message.messageType !== "text" &&
                    message.mediaKey
                ) {
                    const signedUrl =
                        await generatePresignedUrl(
                            message.mediaKey
                        );

                    message.mediaUrl = signedUrl;
                }

                return message;
            })
        );

    return messagesWithSignedUrls;
};

const createPersonalMediaMessage = async ({
    senderId,
    receiverId,
    mediaKey,
    mediaUrl,
    mediaName,
    mediaSize,
    mimeType,
    messageType,
    content = null
}) => {

    const receiver =
        await User.findByPk(receiverId);

    if (!receiver) {
        throw new Error("User does not exist");
    }

    const message =
        await DirectMessage.create({
            senderId,
            receiverId,
            content,
            messageType,
            mediaKey,
            mediaUrl,
            mediaName,
            mediaSize,
            mimeType
        });

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


module.exports = {
    sendPersonalMessage,
    getPersonalMessages,
    createPersonalMediaMessage
};