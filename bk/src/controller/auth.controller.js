const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config/env");

// REGISTER
async function register(req, res) {
  try {
    const { email, password } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        msg: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(201).json({
      msg: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
}

// LOGIN
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Invalid email or password",
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      msg: "Login successful",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
}

// LOGOUT
async function logout(req, res) {
  try {
    res.clearCookie("token");

    res.status(200).json({
      msg: "Logout successful",
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
}

async function getME(req, res) {
  try {
    // Get token from cookies
    const token = req.cookies.token;

    // Check token exists
    if (!token) {
      return res.status(401).json({
        msg: "Unauthorized",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // Return user
    res.status(200).json({
      user,
    });
  } catch (err) {
    res.status(401).json({
      msg: "Invalid token",
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  getME,
};
