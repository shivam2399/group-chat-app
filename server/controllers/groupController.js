const groupService =
    require("../services/groupService");

const getGroups = async (req, res) => {
    try {

        const groups =
            await groupService.getAllGroups();

        return res.status(200).json({
            success: true,
            data: groups
        });

    } catch (error) {

        console.error(
            "Failed to fetch groups:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch groups"
        });
    }
};

module.exports = {
    getGroups
};