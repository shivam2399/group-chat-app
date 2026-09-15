require("dotenv").config();

const {
    generateTypingSuggestions
} = require("./services/aiService");

const test = async () => {
    try {

        const result =
            await generateTypingSuggestions(
                "Let's meet at",
                [
                    {
                        sender: "Alex",
                        content: "Are you free tomorrow?"
                    },
                    {
                        sender: "You",
                        content: "Yes, what time?"
                    }
                ]
            );

        console.log(
            "\nGemini response:\n"
        );

        console.log(result);

    } catch (error) {

        console.error(
            "\nGemini test failed:\n",
            error
        );
    }
};

test();