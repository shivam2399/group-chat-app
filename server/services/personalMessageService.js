const { Op } = require("sequelize")
const DirectMessage = require("../models/DirectMessage");
const ArchivedDirectMessage = require("../models/ArchivedDirectMessage");
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
        otherUserId,
        page = 1,
        limit = 50
    ) => {

        const offset = (page - 1) * limit;


        // Get active messages
        const activeMessages =
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
                    ["createdAt", "DESC"]
                ]
            });


        // Get archived messages
        const archivedMessages =
            await ArchivedDirectMessage.findAll({
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
                    ["createdAt", "DESC"]
                ]
            });


        // Combine both sources
        const allMessages = [
            ...activeMessages,
            ...archivedMessages
        ];


        // Sort newest → oldest
        allMessages.sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );


        // Apply pagination
        const paginatedMessages =
            allMessages.slice(
                offset,
                offset + limit
            );


        // Generate fresh signed URLs
        const messagesWithSignedUrls =
            await Promise.all(
                paginatedMessages.map(
                    async (message) => {

                        if (
                            message.messageType !== "text" &&
                            message.mediaKey
                        ) {
                            const signedUrl =
                                await generatePresignedUrl(
                                    message.mediaKey
                                );

                            message.mediaUrl =
                                signedUrl;
                        }

                        return message;
                    }
                )
            );


        return {
            messages: messagesWithSignedUrls,
            page,
            limit,
            hasMore:
                offset + limit <
                allMessages.length
        };
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