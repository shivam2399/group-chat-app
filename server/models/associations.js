const User = require("./User");
const Group = require("./Group");
const Message = require("./Message");
const DirectMessage = require("./DirectMessage");
const GroupMember = require("./GroupMember");


User.hasMany(Message, {
    foreignKey: "senderId",
    as: "messages"
});

Message.belongsTo(User, {
    foreignKey: "senderId",
    as: "sender"
});


Group.hasMany(Message, {
    foreignKey: "groupId",
    as: "messages"
});

Message.belongsTo(Group, {
    foreignKey: "groupId",
    as: "group"
});

User.hasMany(DirectMessage, {
    foreignKey: "senderId",
    as: "sentDirectMessages"
});

User.hasMany(DirectMessage, {
    foreignKey: "receiverId",
    as: "receivedDirectMessages"
});

DirectMessage.belongsTo(User, {
    foreignKey: "senderId",
    as: "sender"
});

DirectMessage.belongsTo(User, {
    foreignKey: "receiverId",
    as: "receiver"
});

User.hasMany(GroupMember, {
    foreignKey: "userId",
    as: "groupMemberships"
});

GroupMember.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
});

Group.hasMany(GroupMember, {
    foreignKey: "groupId",
    as: "members"
});

GroupMember.belongsTo(Group, {
    foreignKey: "groupId",
    as: "group"
});