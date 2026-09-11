const express = require("express");
const { getGroups, createGroup, addMember, leaveGroup, getGroupMembers } = require("../controllers/groupController");
const authenticateToken = require("../middleware/authMiddleware");
const router = express.Router();


router.get("/", authenticateToken,getGroups);
router.post("/", authenticateToken, createGroup);
router.post("/:groupId/members", authenticateToken, addMember);
router.delete("/:groupId/members/me", authenticateToken, leaveGroup);
router.get("/:groupId/members", authenticateToken, getGroupMembers);


module.exports = router;