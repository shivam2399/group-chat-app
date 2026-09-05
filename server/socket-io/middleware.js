const jwt = require("jsonwebtoken");

const authenticateSocket = (socket, next) => {
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
};

module.exports = authenticateSocket;