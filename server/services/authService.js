const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const registerUser = async ({ name, email, phone, password }) => {

    const existingEmail = await User.findOne({
        where: {
            email
        }
    });

    if (existingEmail) {
        throw new Error("Email is already registered");
    }

    const existingPhone = await User.findOne({
        where: {
            phone
        }
    });

    if (existingPhone) {
        throw new Error("Phone number is already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword
    });

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
    };
};

const loginUser = async (identifier, password) => {

    let user;

    if (identifier.includes("@")) {
        user = await User.findOne({
            where: {
                email: identifier.toLowerCase()
            }
        });
    } else {
        user = await User.findOne({
            where: {
                phone: identifier
            }
        });
    }

    if (!user) {
        throw new Error("Invalid email/phone or password");
    }

    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        throw new Error("Invalid email/phone or password");
    }

    const token = jwt.sign(
        {
            userId: user.id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone
        }
    };
};

module.exports = {
    registerUser,
    loginUser
};