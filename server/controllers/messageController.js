const messageService = require("../services/messageService");

const createMessage = async (req, res) => {
  try {
    const { groupId, content } = req.body;

    // Validate request
    if (!groupId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group ID and message content are required",
      });
    }

    const senderId = req.user.id;

    const message = await messageService.createMessage({
      senderId,
      groupId,
      content: content.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Failed to create message:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await messageService.getMessagesByGroup(
      Number(groupId),
      req.user.id,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch messages",
    });
  }
};

const createMediaMessage = async (req, res) => {
  try {
    const {
      groupId,
      mediaKey,
      mediaUrl,
      mediaName,
      mediaSize,
      mimeType,
      messageType,
      content,
    } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    if (!mediaKey || !mediaName || !mimeType) {
      return res.status(400).json({
        success: false,
        message: "Media information is required",
      });
    }

    const message = await messageService.createMediaMessage({
      senderId: req.user.id,
      groupId,
      mediaKey,
      mediaUrl,
      mediaName,
      mediaSize,
      mimeType,
      messageType,
      content,
    });

    return res.status(201).json({
      success: true,
      message: "Media message created successfully",
      data: message,
    });
  } catch (error) {
    console.error("CREATE MEDIA MESSAGE ERROR:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create media message",
    });
  }
};

module.exports = {
  createMessage,
  getMessages,
  createMediaMessage,
};
