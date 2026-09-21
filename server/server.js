const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

const http = require("http");

const app = require("./app");
const { sequelize, connectDB } = require("./config/db");

require("./models/User");
require("./models/Group");
require("./models/Message");
require("./models/DirectMessage");
require("./models/GroupMember");
require("./models/associations");
require("./models/ArchivedMessage");
require("./models/ArchivedDirectMessage");

const startArchiveJob = require("./jobs/archiveJob");

const initializeSocket = require("./socket-io");
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initializeSocket(server);

const startServer = async () => {
  await connectDB();
  await sequelize.sync();
  console.log("Database synchronized");
  startArchiveJob();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log("HTTP & WebSocket server closed.");
    try {
      await sequelize.close();
      console.log("Database connection pool closed.");
      process.exit(0);
    } catch (err) {
      console.error("Error closing database connection:", err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Forced shutdown after 10s timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
