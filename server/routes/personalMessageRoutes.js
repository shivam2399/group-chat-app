const express = require("express");

const {
    sendPersonalMessage,
    getPersonalMessages
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


module.exports = router;