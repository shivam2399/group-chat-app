const Message = require("../models/Message");
const User = require("../models/User");
const GroupMember = require("../models/GroupMember");
const { generatePresignedUrl } = require("./s3Service");
const { Op } = require("sequelize");
const ArchivedMessage = require("../models/ArchivedMessage");

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
    userId,
    page = 1,
    limit = 50
) => {

    // 1. Verify group membership

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


    // 2. Calculate pagination

    const offset =
        (page - 1) * limit;


    // 3. Get active messages

    const activeMessages =
        await Message.findAll({
            where: {
                groupId
            },
            include: [
                {
                    model: User,
                    as: "sender",
                    attributes: ["id", "name"]
                }
            ],
            order: [
                ["createdAt", "DESC"]
            ]
        });


    // 4. Get archived messages

    const archivedMessages =
        await ArchivedMessage.findAll({
            where: {
                groupId
            },
            include: [
                {
                    model: User,
                    as: "sender",
                    attributes: ["id", "name"]
                }
            ],
            order: [
                ["createdAt", "DESC"]
            ]
        });


    // 5. Combine both sources

    const allMessages = [
        ...activeMessages,
        ...archivedMessages
    ];


    // 6. Sort newest → oldest

    allMessages.sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );


    // 7. Apply pagination

    const paginatedMessages =
        allMessages.slice(
            offset,
            offset + limit
        );


    // 8. Generate fresh S3 URLs

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
        messages:
            messagesWithSignedUrls,

        page,

        limit,

        hasMore:
            offset + limit <
            allMessages.length
    };
};

const createMediaMessage = async ({
    senderId,
    groupId,
    mediaKey,
    mediaUrl,
    mediaName,
    mediaSize,
    mimeType,
    messageType,
    content = null
}) => {
    // 1. Verify group membership
    const membership = await GroupMember.findOne({
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

    // 2. Create message
    const message = await Message.create({
        senderId,
        groupId,
        content,
        messageType,
        mediaKey,
        mediaUrl,
        mediaName,
        mediaSize,
        mimeType
    });

    // 3. Fetch sender information
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


module.exports = {
    createMessage,
    getMessagesByGroup,
    createMediaMessage
};