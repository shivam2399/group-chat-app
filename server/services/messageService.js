const Message = require("../models/Message");
const User = require("../models/User");
const GroupMember = require("../models/GroupMember");
const { generatePresignedUrl } = require("./s3Service");

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

    // Generate temporary URLs for media messages
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