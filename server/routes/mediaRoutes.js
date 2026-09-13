const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");

const { uploadMedia } = require("../controllers/mediaController");

router.post(
    "/upload",
    authenticateToken,
    upload.single("file"),
    uploadMedia
);

module.exports = router;