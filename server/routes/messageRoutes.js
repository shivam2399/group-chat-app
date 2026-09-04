const express = require("express");

const {
    createMessage,
    getMessages
} = require("../controllers/messageController");

const authenticateToken =
    require("../middleware/authMiddleware");

const router = express.Router();


router.post(
    "/",
    authenticateToken,
    createMessage
);


router.get(
    "/:groupId",
    authenticateToken,
    getMessages
);


module.exports = router;