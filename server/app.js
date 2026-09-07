const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes")
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const groupRoutes = require("./routes/groupRoutes");
const personalMessageRoutes = require("./routes/personalMessageRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/personal-messages", personalMessageRoutes);

module.exports = app;