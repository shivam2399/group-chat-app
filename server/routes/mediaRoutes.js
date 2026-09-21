const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  getPresignedUploadUrl,
  uploadMedia,
} = require("../controllers/mediaController");

// Direct S3 presigned upload URL (recommended - 0 memory overhead on server)
router.post("/presign-upload", authenticateToken, getPresignedUploadUrl);

// Fallback direct buffer upload through Express
router.post("/upload", authenticateToken, upload.single("file"), uploadMedia);

module.exports = router;
