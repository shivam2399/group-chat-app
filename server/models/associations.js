const User = require("./User");
const Group = require("./Group");
const Message = require("./Message");


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