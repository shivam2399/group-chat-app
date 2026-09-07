const personalMessageService =
    require("../services/personalMessageService");


/* ==================== SEND MESSAGE ==================== */

const sendPersonalMessage = async (req, res) => {
    try {

        const {
            receiverId,
            content
        } = req.body;

        if (!receiverId || !content?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Receiver ID and message content are required"
            });
        }

        /*
            IMPORTANT:
            senderId comes from the JWT,
            NOT from the frontend.
        */

        const senderId =
            req.user.id;

        const message =
            await personalMessageService
                .sendPersonalMessage({
                    senderId,
                    receiverId,
                    content: content.trim()
                });

        return res.status(201).json({
            success: true,
            message:
                "Personal message sent successfully",
            data: message
        });

    } catch (error) {

        console.error(
            "Failed to send personal message:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to send personal message"
        });
    }
};


/* ==================== GET CONVERSATION ==================== */

const getPersonalMessages = async (req, res) => {
    try {

        const {
            userId: otherUserId
        } = req.params;

        if (!otherUserId) {
            return res.status(400).json({
                success: false,
                message:
                    "User ID is required"
            });
        }

        /*
            Current user comes from JWT.
        */

        const userId =
            req.user.id;

        const messages =
            await personalMessageService
                .getPersonalMessages(
                    userId,
                    Number(otherUserId)
                );

        return res.status(200).json({
            success: true,
            data: messages
        });

    } catch (error) {

        console.error(
            "Failed to fetch personal messages:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch personal messages"
        });
    }
};


module.exports = {
    sendPersonalMessage,
    getPersonalMessages
};