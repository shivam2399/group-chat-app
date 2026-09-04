require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const app = require("./app");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(
                new Error("Authentication token is required")
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        socket.user = {
            id: decoded.userId
        };

        next();

    } catch (error) {
        console.error(
            "Socket authentication failed:",
            error.message
        );

        next(new Error("Invalid or expired token"));
    }
});

io.on("connection", (socket) => {
    console.log("User connected: " + socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
    })
});

const {
    sequelize,
    connectDB
} = require("./config/db");

require("./models/User");
require("./models/Group");
require("./models/Message");
require("./models/associations");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await sequelize.sync();
    console.log("Database synchronized");

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();