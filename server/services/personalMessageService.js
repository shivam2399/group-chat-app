const { Op } = require("sequelize");
const DirectMessage = require("../models/DirectMessage");
const ArchivedDirectMessage = require("../models/ArchivedDirectMessage");
const User = require("../models/User");
const { generatePresignedUrl } = require("./s3Service");
const { NotFoundError } = require("../utils/errors");

/*
    Send a personal message
*/
const sendPersonalMessage = async ({ senderId, receiverId, content }) => {
  const receiver = await User.findByPk(receiverId);
  if (!receiver) {
    throw new NotFoundError("Receiver does not exist");
  }

  const message = await DirectMessage.create({
    senderId,
    receiverId,
    content,
  });

  /*
        Fetch the message again with
        sender and receiver information.
    */
  const messageWithUsers = await DirectMessage.findByPk(message.id, {
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "receiver",
        attributes: ["id", "name"],
      },
    ],
  });

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
  limit = 50,
) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  const whereClause = {
    [Op.or]: [
      {
        senderId: userId,
        receiverId: otherUserId,
      },
      {
        senderId: otherUserId,
        receiverId: userId,
      },
    ],
  };

  const userInclude = [
    {
      model: User,
      as: "sender",
      attributes: ["id", "name"],
    },
    {
      model: User,
      as: "receiver",
      attributes: ["id", "name"],
    },
  ];

  // 1. Count active direct messages
  const activeCount = await DirectMessage.count({
    where: whereClause,
  });

  let paginatedMessages = [];

  if (offset < activeCount) {
    // Fetch from active table with SQL limit and offset
    const activeMessages = await DirectMessage.findAll({
      where: whereClause,
      include: userInclude,
      order: [["createdAt", "DESC"]],
      limit: safeLimit,
      offset,
    });

    paginatedMessages = [...activeMessages];

    // If active messages did not fill the page, backfill from archive
    if (paginatedMessages.length < safeLimit) {
      const remainingLimit = safeLimit - paginatedMessages.length;
      const archivedMessages = await ArchivedDirectMessage.findAll({
        where: whereClause,
        include: userInclude,
        order: [["createdAt", "DESC"]],
        limit: remainingLimit,
        offset: 0,
      });
      paginatedMessages = [...paginatedMessages, ...archivedMessages];
    }
  } else {
    // Offset starts inside archived table
    const archiveOffset = offset - activeCount;
    const archivedMessages = await ArchivedDirectMessage.findAll({
      where: whereClause,
      include: userInclude,
      order: [["createdAt", "DESC"]],
      limit: safeLimit,
      offset: archiveOffset,
    });
    paginatedMessages = [...archivedMessages];
  }

  const archivedCount = await ArchivedDirectMessage.count({
    where: whereClause,
  });

  const totalCount = activeCount + archivedCount;

  // 2. Generate fresh signed URLs for paginated slice only
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

const createPersonalMediaMessage = async ({
  senderId,
  receiverId,
  mediaKey,
  mediaUrl,
  mediaName,
  mediaSize,
  mimeType,
  messageType,
  content = null,
}) => {
  const receiver = await User.findByPk(receiverId);

  if (!receiver) {
    throw new NotFoundError("User does not exist");
  }

  const message = await DirectMessage.create({
    senderId,
    receiverId,
    content,
    messageType,
    mediaKey,
    mediaUrl,
    mediaName,
    mediaSize,
    mimeType,
  });

  const messageWithUsers = await DirectMessage.findByPk(message.id, {
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "receiver",
        attributes: ["id", "name"],
      },
    ],
  });

  return messageWithUsers;
};

module.exports = {
  sendPersonalMessage,
  getPersonalMessages,
  createPersonalMediaMessage,
};
