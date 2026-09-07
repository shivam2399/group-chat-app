require("dotenv").config();

const http = require("http");

const app = require("./app");
const {
    sequelize,
    connectDB
} = require("./config/db");

require("./models/User");
require("./models/Group");
require("./models/Message");
require("./models/DirectMessage")
require("./models/associations");

const initializeSocket =
    require("./socket-io");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initializeSocket(server)

const startServer = async () => {
    await connectDB();
    await sequelize.sync();
    console.log("Database synchronized");

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();