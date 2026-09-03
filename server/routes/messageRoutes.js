const express = require("express");

const {
    createMessage
} = require("../controllers/messageController");

const authenticateToken =
    require("../middleware/authMiddleware");


const router = express.Router();


router.post(
    "/",
    authenticateToken,
    createMessage
);


module.exports = router;