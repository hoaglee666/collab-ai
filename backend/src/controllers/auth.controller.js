import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import Project from "../models/project.model.js";
import { resolveMx } from "dns/promises";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    //check exist
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    const domain = email.split("@")[1].toLowerCase();
    const blockedDomains = ["gamil.com", "hotmal.com", "yhoo.com"];
    if (blockedDomains.includes(domain)) {
      return res
        .status(400)
        .json({ message: "Invalid domain. Please check for typos." });
    }
    try {
      // This asks the internet: "Does this domain have email servers?"
      const mxRecords = await resolveMx(domain);

      if (!mxRecords || mxRecords.length === 0) {
        throw new Error("No mail server");
      }
    } catch (error) {
      // If DNS fails (domain doesn't exist) or has no mail servers
      return res.status(400).json({
        message: "This domain does not exist or cannot receive emails.",
      });
    }
    //create new
    const user = await User.create({ username, email, password });
    res.status(201).json({
      message: "User registered successfully",
      userId: user.id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- 🛡️ SAFETY CHECK FOR OAUTH USERS ---
    if (!user.password) {
      return res.status(400).json({
        message:
          "This account uses Google/GitHub login. Please use the buttons below.",
      });
    }
    // ----------------------------------------

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ... Generate Token and respond ...
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; //from token
    const { username, password } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    //update username
    if (username) {
      user.username = username;
    }
    //up pass
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    await user.save();
    res.json({
      message: "Profile updated successfully",
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    //delete all project own by user
    await Project.destroy({ where: { userId } });
    //delete user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.destroy();
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    // Multer saves the file, we just need the filename
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    // Update the user
    const user = await User.findByPk(userId);
    user.avatarUrl = avatarUrl;
    await user.save();

    res.json({ message: "Avatar updated", avatarUrl });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  res.json(user);
};
