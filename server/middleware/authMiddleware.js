const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;


        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });

        }


        const token = authHeader.split(" ")[1];


        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Invalid authentication header"
            });

        }


        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        req.user = {
            id: decoded.userId
        };


        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }
};


module.exports = authenticateToken;