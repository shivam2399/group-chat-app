require("dotenv").config();

const {
    connectDB
} = require("./config/db");

require("./models/User");
require("./models/Group");
require("./models/Message");
require("./models/DirectMessage");
require("./models/GroupMember");
require("./models/ArchivedMessage");
require("./models/ArchivedDirectMessage");
require("./models/associations");

const {
    archiveOldMessages
} = require("./services/archiveService");


const run = async () => {

    try {

        await connectDB();

        console.log(
            "Running archive job manually..."
        );

        await archiveOldMessages();

        console.log(
            "Archive job finished."
        );

        process.exit(0);

    } catch (error) {

        console.error(
            "Archive test failed:",
            error
        );

        process.exit(1);
    }
};


run();