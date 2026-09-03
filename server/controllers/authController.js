const authService = require("../services/authService");

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password
        } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const user = await authService.registerUser({
            name,
            email,
            phone,
            password
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const {
            identifier,
            password
        } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Email/phone and password are required"
            });
        }

        const result = await authService.loginUser(
            identifier,
            password
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            ...result
        });

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register,
    login
};