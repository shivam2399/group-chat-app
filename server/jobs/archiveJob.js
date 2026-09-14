const cron = require("node-cron");

const {
    archiveOldMessages
} = require("../services/archiveService");


const startArchiveJob = () => {

    cron.schedule(
        "0 2 * * *",
        async () => {

            console.log(
                "Running scheduled message archival..."
            );

            try {

                await archiveOldMessages();

                console.log(
                    "Scheduled archival completed."
                );

            } catch (error) {

                console.error(
                    "Scheduled archival failed:",
                    error
                );

            }
        }
    );

    console.log(
        "Message archive cron job scheduled."
    );
};


module.exports = startArchiveJob;