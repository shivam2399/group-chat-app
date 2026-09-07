const Group = require("../models/Group");
const Message = require("../models/Message");
const User = require("../models/User");

const getAllGroups = async () => {
    const groups = await Group.findAll({
        order: [["createdAt", "ASC"]]
    });

    const groupsWithLatestMessage = await Promise.all(
        groups.map(async (group) => {
            const latestMessage = await Message.findOne({
                where: { groupId: group.id },
                include: [
                    {
                        model: User,
                        as: "sender",
                        attributes: ["id", "name"]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            return {
                id: group.id,
                name: group.name,
                latestMessage
            };
        })
    );

    return groupsWithLatestMessage;
};

const getAllGroupIds = async () => {
    const groups = await Group.findAll({
        attributes: ["id"],
        order: [["id", "ASC"]]
    });

    return groups.map((group) => group.id);
};

module.exports = {
    getAllGroups,
    getAllGroupIds
};