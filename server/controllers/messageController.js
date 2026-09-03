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

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
};


module.exports = {
    createMessage
};