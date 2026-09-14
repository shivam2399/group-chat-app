const { Op } = require("sequelize");

const Message = require("../models/Message");
const DirectMessage = require("../models/DirectMessage");

const ArchivedMessage =
    require("../models/ArchivedMessage");

const ArchivedDirectMessage =
    require("../models/ArchivedDirectMessage");

const { sequelize } =
    require("../config/db");


const BATCH_SIZE = 500;


const archiveGroupMessages = async (
    cutoffDate,
    transaction
) => {

    let totalArchived = 0;

    while (true) {

        const messages =
            await Message.findAll({
                where: {
                    createdAt: {
                        [Op.lt]: cutoffDate
                    }
                },
                order: [
                    ["createdAt", "ASC"],
                    ["id", "ASC"]
                ],
                limit: BATCH_SIZE,
                transaction
            });

        if (!messages.length) {
            break;
        }

        const archivedMessages =
            messages.map((message) => ({
                id: message.id,
                senderId: message.senderId,
                groupId: message.groupId,
                content: message.content,
                messageType: message.messageType,
                mediaKey: message.mediaKey,
                mediaUrl: message.mediaUrl,
                mediaName: message.mediaName,
                mediaSize: message.mediaSize,
                mimeType: message.mimeType,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt
            }));


        await ArchivedMessage.bulkCreate(
            archivedMessages,
            {
                transaction
            }
        );


        const messageIds =
            messages.map(
                (message) => message.id
            );


        await Message.destroy({
            where: {
                id: {
                    [Op.in]: messageIds
                }
            },
            transaction
        });


        totalArchived += messages.length;


        console.log(
            `Archived ${messages.length} group messages`
        );
    }

    return totalArchived;
};


const archiveDirectMessages = async (
    cutoffDate,
    transaction
) => {

    let totalArchived = 0;

    while (true) {

        const messages =
            await DirectMessage.findAll({
                where: {
                    createdAt: {
                        [Op.lt]: cutoffDate
                    }
                },
                order: [
                    ["createdAt", "ASC"],
                    ["id", "ASC"]
                ],
                limit: BATCH_SIZE,
                transaction
            });

        if (!messages.length) {
            break;
        }


        const archivedMessages =
            messages.map((message) => ({
                id: message.id,
                senderId: message.senderId,
                receiverId: message.receiverId,
                content: message.content,
                messageType: message.messageType,
                mediaKey: message.mediaKey,
                mediaUrl: message.mediaUrl,
                mediaName: message.mediaName,
                mediaSize: message.mediaSize,
                mimeType: message.mimeType,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt
            }));


        await ArchivedDirectMessage.bulkCreate(
            archivedMessages,
            {
                transaction
            }
        );


        const messageIds =
            messages.map(
                (message) => message.id
            );


        await DirectMessage.destroy({
            where: {
                id: {
                    [Op.in]: messageIds
                }
            },
            transaction
        });


        totalArchived += messages.length;


        console.log(
            `Archived ${messages.length} direct messages`
        );
    }

    return totalArchived;
};


const archiveOldMessages = async () => {

    const transaction =
        await sequelize.transaction();

    try {

        const cutoffDate =
            new Date(
                Date.now() -
                24 * 60 * 60 * 1000
            );


        console.log(
            "Starting message archival..."
        );


        const archivedGroupCount =
            await archiveGroupMessages(
                cutoffDate,
                transaction
            );


        const archivedDirectCount =
            await archiveDirectMessages(
                cutoffDate,
                transaction
            );


        await transaction.commit();


        console.log(
            "Message archival completed:",
            {
                groupMessages:
                    archivedGroupCount,

                directMessages:
                    archivedDirectCount
            }
        );

    } catch (error) {

        await transaction.rollback();

        console.error(
            "Message archival failed:",
            error
        );

        throw error;
    }
};


module.exports = {
    archiveOldMessages
};