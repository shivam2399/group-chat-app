const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const generateTypingSuggestions = async (
    draft,
    recentMessages = []
) => {

    const conversation = recentMessages
        .map((message) => {
            return `${message.sender}: ${message.content}`;
        })
        .join("\n");

    const prompt = `
You are an AI assistant inside a chat application.

Generate exactly 3 concise suggestions for what the user
could type next.

Current draft:
"${draft}"

Recent conversation:
${conversation}

Rules:
- Suggestions must naturally continue the user's draft.
- Keep each suggestion short.
- Make them relevant to the conversation.
- Do not repeat the existing draft.
- Do not explain your choices.
- Return exactly 3 suggestions.
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",

        contents: prompt,

        config: {
            responseMimeType: "application/json",

            responseSchema: {
                type: "object",

                properties: {
                    suggestions: {
                        type: "array",

                        items: {
                            type: "string"
                        }
                    }
                },

                required: [
                    "suggestions"
                ]
            }
        }
    });

    const result =
        JSON.parse(response.text);

    return result.suggestions;
};

const generateSmartReplies = async (
    incomingMessage,
    recentMessages = []
) => {

    const conversation = recentMessages
        .map((message) => {
            return `${message.sender}: ${message.content}`;
        })
        .join("\n");

    const prompt = `
You are an AI assistant inside a chat application.

Generate exactly 3 short smart reply options
for the user to respond to the incoming message.

Incoming message:
"${incomingMessage}"

Recent conversation:
${conversation}

Rules:
- Replies must be relevant to the incoming message.
- Keep each reply short and natural.
- Make them suitable for casual everyday conversation.
- Use emojis occasionally when appropriate.
- Do not repeat the incoming message.
- Do not explain your choices.
- Return exactly 3 replies.
`;

    const response =
        await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",

                responseSchema: {
                    type: "object",

                    properties: {
                        replies: {
                            type: "array",

                            items: {
                                type: "string"
                            }
                        }
                    },

                    required: [
                        "replies"
                    ]
                }
            }
        });

    const result =
        JSON.parse(response.text);

    return result.replies;
};

module.exports = {
    generateTypingSuggestions,
    generateSmartReplies
};