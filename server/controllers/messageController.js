const messageService = require("../services/messageService");

const createMessage = async (req, res) => {

    try {

        const {
            groupId,
            content
        } = req.body;


        // Validate request
        if (!groupId || !content) {

            return res.status(400).json({
                success: false,
                message: "Group ID and message content are required"
            });

        }


        // Get user ID from JWT
        const senderId = req.user.id;


        const message =
            await messageService.createMessage({
                senderId,
                groupId,
                content
            });


        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: message
        });

    } catch (error) {

        console.error(
            "Failed to create message:",
            error
        );

        if (
            error.message ===
            "You are not a member of this group"
        ) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
};

const getMessages = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group ID is required"
            });
        }

        const messages = await messageService.getMessagesByGroup(groupId, req.user.id);

        return res.status(200).json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error("Failed to fetch messages:", error);

        if (
            error.message ===
            "You are not a member of this group"
        ) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to fetch messages"
        });
    }
};


module.exports = {
    createMessage,
    getMessages
};