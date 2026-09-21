const Message = require("../models/Message");
const User = require("../models/User");
const GroupMember = require("../models/GroupMember");
const { generatePresignedUrl } = require("./s3Service");
const { Op } = require("sequelize");
const ArchivedMessage = require("../models/ArchivedMessage");
const { ForbiddenError } = require("../utils/errors");

const createMessage = async ({ senderId, groupId, content }) => {
  const membership = await GroupMember.findOne({
    where: {
      groupId,
      userId: senderId,
    },
  });

  if (!membership) {
    throw new ForbiddenError("You are not a member of this group");
  }

  const message = await Message.create({
    senderId,
    groupId,
    content,
  });

  const messageWithSender = await Message.findByPk(message.id, {
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["id", "name"],
      },
    ],
  });

  return messageWithSender;
};

const getMessagesByGroup = async (groupId, userId, page = 1, limit = 50) => {
  // 1. Verify group membership
  const membership = await GroupMember.findOne({
    where: {
      groupId,
      userId,
    },
  });

  if (!membership) {
    throw new ForbiddenError("You are not a member of this group");
  }

  // 2. Calculate pagination
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  // 3. Count active and archived messages efficiently
  const activeCount = await Message.count({
    where: { groupId },
  });

  let paginatedMessages = [];

  if (offset < activeCount) {
    // Fetch from active table with SQL limit and offset
    const activeMessages = await Message.findAll({
      where: { groupId },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: safeLimit,
      offset,
    });

    paginatedMessages = [...activeMessages];

    // If we didn't fill the page with active messages, backfill from archive
    if (paginatedMessages.length < safeLimit) {
      const remainingLimit = safeLimit - paginatedMessages.length;
      const archivedMessages = await ArchivedMessage.findAll({
        where: { groupId },
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "name"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: remainingLimit,
        offset: 0,
      });
      paginatedMessages = [...paginatedMessages, ...archivedMessages];
    }
  } else {
    // Offset starts inside the archived messages table
    const archiveOffset = offset - activeCount;
    const archivedMessages = await ArchivedMessage.findAll({
      where: { groupId },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: safeLimit,
      offset: archiveOffset,
    });
    paginatedMessages = [...archivedMessages];
  }

  const archivedCount = await ArchivedMessage.count({
    where: { groupId },
  });

  const totalCount = activeCount + archivedCount;

  // 4. Generate fresh S3 URLs for paginated slice only
  const messagesWithSignedUrls = await Promise.all(
    paginatedMessages.map(async (message) => {
      if (message.messageType !== "text" && message.mediaKey) {
        const signedUrl = await generatePresignedUrl(message.mediaKey);
        message.mediaUrl = signedUrl;
      }
      return message;
    }),
  );

  return {
    messages: messagesWithSignedUrls,
    page: safePage,
    limit: safeLimit,
    hasMore: offset + safeLimit < totalCount,
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
  content = null,
}) => {
  // 1. Verify group membership
  const membership = await GroupMember.findOne({
    where: {
      groupId,
      userId: senderId,
    },
  });

  if (!membership) {
    throw new ForbiddenError("You are not a member of this group");
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
    mimeType,
  });

  // 3. Fetch sender information
  const messageWithSender = await Message.findByPk(message.id, {
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["id", "name"],
      },
    ],
  });

  return messageWithSender;
};

module.exports = {
  createMessage,
  getMessagesByGroup,
  createMediaMessage,
};
