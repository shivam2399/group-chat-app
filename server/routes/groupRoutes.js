const express = require("express");

const {
    getGroups
} = require("../controllers/groupController");

const authenticateToken =
    require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    getGroups
);

module.exports = router;