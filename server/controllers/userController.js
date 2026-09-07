const User = require("../models/User");

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["id", "name", "email"],
            where: {
                id: {
                    [require("sequelize").Op.ne]: req.user.id
                }
            },
            order: [["name", "ASC"]]
        });

        return res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error("Failed to fetch users:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
};

module.exports = {
    getUsers
};