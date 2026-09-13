const express = require("express");

const {
    sendPersonalMessage,
    getPersonalMessages,
    createPersonalMediaMessage
} = require("../controllers/personalMessageController");

const authenticateToken =
    require("../middleware/authMiddleware");

const router =
    express.Router();


/* ==================== SEND ==================== */

router.post(
    "/",
    authenticateToken,
    sendPersonalMessage
);


/* ==================== GET CONVERSATION ==================== */

router.get(
    "/:userId",
    authenticateToken,
    getPersonalMessages
);

router.post(
    "/media",
    authenticateToken,
    createPersonalMediaMessage
);


module.exports = router;