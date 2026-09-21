const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
  getTypingSuggestions,
  getSmartReplies,
} = require("../controllers/aiController");

// Rate limit AI queries to protect quota and mitigate keystroke spam (max 20 req/min)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI assistance requests. Please wait a moment.",
  },
});

router.use(aiRateLimiter);

router.post("/typing-suggestions", authenticateToken, getTypingSuggestions);

router.post("/smart-replies", authenticateToken, getSmartReplies);

module.exports = router;
