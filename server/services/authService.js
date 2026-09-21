const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ConflictError, UnauthorizedError } = require("../utils/errors");

const registerUser = async ({ name, email, phone, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();
  const cleanName = name.trim();

  const existingEmail = await User.findOne({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingEmail) {
    throw new ConflictError("Email is already registered");
  }

  const existingPhone = await User.findOne({
    where: {
      phone: normalizedPhone,
    },
  });

  if (existingPhone) {
    throw new ConflictError("Phone number is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: cleanName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: hashedPassword,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
};

const loginUser = async (identifier, password) => {
  let user;
  const cleanIdentifier = identifier.trim();

  if (cleanIdentifier.includes("@")) {
    user = await User.findOne({
      where: {
        email: cleanIdentifier.toLowerCase(),
      },
    });
  } else {
    user = await User.findOne({
      where: {
        phone: cleanIdentifier,
      },
    });
  }

  if (!user) {
    throw new UnauthorizedError("Invalid email/phone or password");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new UnauthorizedError("Invalid email/phone or password");
  }

  const token = jwt.sign(
    {
      userId: user.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  };
};

module.exports = {
  registerUser,
  loginUser,
};
