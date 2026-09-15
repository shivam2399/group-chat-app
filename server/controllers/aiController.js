const {
    generateTypingSuggestions,
    generateSmartReplies
} = require("../services/aiService");

const getTypingSuggestions = async (req, res) => {
    try {
        const {
            draft,
            recentMessages = []
        } = req.body;

        if (!draft?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Draft is required"
            });
        }

        const suggestions =
            await generateTypingSuggestions(
                draft.trim(),
                recentMessages
            );

        return res.status(200).json({
            success: true,
            data: {
                suggestions
            }
        });

    } catch (error) {

        console.error(
            "AI TYPING SUGGESTION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate typing suggestions"
        });
    }
};

const getSmartReplies = async (req, res) => {
    try {
        const {
            incomingMessage,
            recentMessages = []
        } = req.body;

        if (!incomingMessage?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Incoming message is required"
            });
        }

        const replies =
            await generateSmartReplies(
                incomingMessage.trim(),
                recentMessages
            );

        return res.status(200).json({
            success: true,
            data: {
                replies
            }
        });

    } catch (error) {

        console.error(
            "AI SMART REPLY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate smart replies"
        });
    }
};

module.exports = {
    getTypingSuggestions,
    getSmartReplies
};