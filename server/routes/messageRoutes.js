const express = require("express");

const {
    createMessage,
    getMessages,
    createMediaMessage
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

router.post(
    "/media",
    authenticateToken,
    createMediaMessage
);


module.exports = router;