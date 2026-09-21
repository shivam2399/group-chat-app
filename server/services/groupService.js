const { Op } = require("sequelize");
const { sequelize } = require("../config/db");
const Group = require("../models/Group");
const Message = require("../models/Message");
const User = require("../models/User");
const GroupMember = require("../models/GroupMember");
const {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} = require("../utils/errors");

const getAllGroups = async (userId) => {
  const memberships = await GroupMember.findAll({
    where: {
      userId,
    },
    include: [
      {
        model: Group,
        as: "group",
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  const groupsWithLatestMessage = await Promise.all(
    memberships.map(async (membership) => {
      const group = membership.group;

      const latestMessage = await Message.findOne({
        where: {
          groupId: group.id,
        },
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "name"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      return {
        id: group.id,
        name: group.name,
        latestMessage,
      };
    }),
  );

  return groupsWithLatestMessage;
};

const getAllGroupIds = async () => {
  const groups = await Group.findAll({
    attributes: ["id"],
    order: [["id", "ASC"]],
  });

  return groups.map((group) => group.id);
};

const createGroup = async ({ name, userId }) => {
  return await sequelize.transaction(async (t) => {
    const group = await Group.create(
      {
        name,
        createdBy: userId,
      },
      { transaction: t },
    );

    await GroupMember.create(
      {
        groupId: group.id,
        userId: userId,
        role: "admin",
      },
      { transaction: t },
    );

    return group;
  });
};

const addMemberToGroup = async ({ groupId, userId, requesterId }) => {
  // 1. Check if the group exists
  const group = await Group.findByPk(groupId);

  if (!group) {
    throw new NotFoundError("Group does not exist");
  }

  // 2. Check if the requester is a member of the group
  const requesterMembership = await GroupMember.findOne({
    where: {
      groupId,
      userId: requesterId,
    },
  });

  if (!requesterMembership) {
    throw new ForbiddenError("You are not a member of this group");
  }

  // 3. Check if the requester is an admin
  if (requesterMembership.role !== "admin") {
    throw new ForbiddenError("Only group admins can add members");
  }

  // 4. Check if the user being added exists
  const user = await User.findByPk(userId);

  if (!user) {
    throw new NotFoundError("User does not exist");
  }

  // 5. Prevent adding an existing member
  const existingMembership = await GroupMember.findOne({
    where: {
      groupId,
      userId,
    },
  });

  if (existingMembership) {
    throw new BadRequestError("User is already a member of this group");
  }

  // 6. Add the user
  const membership = await GroupMember.create({
    groupId,
    userId,
    role: "member",
  });

  return membership;
};

const leaveGroup = async ({ groupId, userId }) => {
  return await sequelize.transaction(async (t) => {
    const membership = await GroupMember.findOne({
      where: {
        groupId,
        userId,
      },
      transaction: t,
    });

    if (!membership) {
      throw new ForbiddenError("You are not a member of this group");
    }

    // Normal member leaves
    if (membership.role === "member") {
      await membership.destroy({ transaction: t });

      return {
        message: "You left the group successfully",
      };
    }

    // Admin is leaving: find successor member
    const otherMember = await GroupMember.findOne({
      where: {
        groupId,
        userId: {
          [Op.ne]: userId,
        },
      },
      order: [["createdAt", "ASC"]],
      transaction: t,
    });

    // No other member exists
    if (!otherMember) {
      throw new BadRequestError(
        "You cannot leave a group without another member",
      );
    }

    // Transfer admin role to successor
    otherMember.role = "admin";
    await otherMember.save({ transaction: t });

    // Remove old admin
    await membership.destroy({ transaction: t });

    return {
      message: "You left the group successfully",
    };
  });
};

const getGroupMembers = async ({ groupId, userId }) => {
  // Check whether requester is a member
  const requesterMembership = await GroupMember.findOne({
    where: {
      groupId,
      userId,
    },
  });

  if (!requesterMembership) {
    throw new ForbiddenError("You are not a member of this group");
  }

  // Get all members
  const members = await GroupMember.findAll({
    where: {
      groupId,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  return members;
};

module.exports = {
  getAllGroups,
  getAllGroupIds,
  createGroup,
  addMemberToGroup,
  leaveGroup,
  getGroupMembers,
};
