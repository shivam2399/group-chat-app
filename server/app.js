const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const groupRoutes = require("./routes/groupRoutes");
const personalMessageRoutes = require("./routes/personalMessageRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for load balancers / deployment monitoring
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/personal-messages", personalMessageRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/ai", aiRoutes);

// Serve static frontend files
const clientPath =
  process.env.CLIENT_STATIC_PATH || path.join(__dirname, "../client");
app.use(express.static(clientPath));

// Root redirect to login page
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// 404 handler for unknown API or static routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "An unexpected server error occurred"
        : message,
  });
});

module.exports = app;
