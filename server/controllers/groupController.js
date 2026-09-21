const groupService = require("../services/groupService");

const getGroups = async (req, res) => {
  try {
    const groups = await groupService.getAllGroups(req.user.id);
    return res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch groups",
    });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    const group = await groupService.createGroup({
      name: name.trim(),
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group,
    });
  } catch (error) {
    console.error("Create group error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create group",
    });
  }
};

const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const membership = await groupService.addMemberToGroup({
      groupId: Number(groupId),
      userId: Number(userId),
      requesterId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: membership,
    });
  } catch (error) {
    console.error("Failed to add member:", error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to add member",
    });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    const result = await groupService.leaveGroup({
      groupId: Number(groupId),
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Failed to leave group:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to leave group",
    });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    const members = await groupService.getGroupMembers({
      groupId: Number(groupId),
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Failed to fetch group members:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch group members",
    });
  }
};

module.exports = {
  getGroups,
  createGroup,
  addMember,
  leaveGroup,
  getGroupMembers,
};
