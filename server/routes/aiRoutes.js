const express = require("express");
const router = express.Router();

const authenticateToken =
    require("../middleware/authMiddleware");

const {
    getTypingSuggestions,
    getSmartReplies
} = require("../controllers/aiController");

router.post(
    "/typing-suggestions",
    authenticateToken,
    getTypingSuggestions
);

router.post(
    "/smart-replies",
    authenticateToken,
    getSmartReplies
);

module.exports = router;