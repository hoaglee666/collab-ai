import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import { Op } from "sequelize";

// create project
export const createProject = async (req, res) => {
  try {
    const { name, description, deadline, visibility } = req.body;
    const userId = req.user.id;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const project = await Project.create({
      name,
      description,
      userId,
      imageUrl,
      deadline,
      visibility: visibility || "public",
    });

    // 🔄 RELOAD WITH CORRECT ALIAS
    const projectWithUser = await Project.findByPk(project.id, {
      include: {
        model: User,
        as: "Owner", // <--- FIXED: Added alias
        attributes: ["username"],
      },
    });

    req.io.emit("project:created", projectWithUser);

    res.status(201).json(project);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating project", error: error.message });
  }
};

// get all projects (public community)
export const getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order || "DESC";
    const offset = (page - 1) * limit;

    const searchCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
            // 🔎 FIXED: Search inside 'Owner', not 'User'
            { "$Owner.username$": { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await Project.findAndCountAll({
      where: searchCondition,
      include: {
        model: User,
        as: "Owner", // <--- FIXED: Added alias
        attributes: ["username", "avatarUrl"],
      },
      order: [[sortBy, order]],
      limit: limit,
      offset: offset,
    });

    res.json({
      projects: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching projects" });
  }
};

// get mine
export const getMyProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      include: {
        model: User,
        as: "Owner", // <--- FIXED: Added alias
        attributes: ["username", "avatarUrl"],
      },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching my projects" });
  }
};

// get by ID (This was already good, keeping it correct)
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: "Owner",
          attributes: ["id", "username", "avatarUrl"],
        },
        {
          model: User,
          as: "Members",
          attributes: ["id", "username", "avatarUrl", "email"],
        },
      ],
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// delete (Standard)
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const project = await Project.findOne({ where: { id, userId } });
    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }
    await project.destroy();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting project", error: error.message });
  }
};

// update (Standard)
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, status, deadline, visibility } = req.body;

    const project = await Project.findOne({ where: { id, userId } });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (deadline) project.deadline = deadline;
    if (req.file) {
      project.imageUrl = `/uploads/${req.file.filename}`;
    }
    if (visibility) project.visibility = visibility;

    await project.save();
    res.json({ message: "Project updated", project });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// Add Member
export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const currentUserId = req.user.id;

    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.userId !== currentUserId) {
      return res
        .status(403)
        .json({ message: "Only the project owner can add members." });
    }

    const userToAdd = await User.findOne({ where: { email } });
    if (!userToAdd)
      return res
        .status(404)
        .json({ message: "User with this email not found." });

    if (userToAdd.id === project.userId) {
      return res.status(400).json({ message: "User is already the owner." });
    }

    const hasMember = await project.hasMember(userToAdd);
    if (hasMember) {
      return res.status(400).json({ message: "User is already in the team." });
    }

    await project.addMember(userToAdd);

    res.json({
      message: `${userToAdd.username} added to the team!`,
      member: userToAdd,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add member" });
  }
};

// Remove Member
export const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.user.id;

    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.userId !== currentUserId) {
      return res
        .status(403)
        .json({ message: "Only the project owner can remove members." });
    }

    if (userId === project.userId) {
      return res
        .status(400)
        .json({ message: "You cannot kick yourself (the owner)." });
    }

    const userToRemove = await User.findByPk(userId);
    if (!userToRemove)
      return res.status(404).json({ message: "User not found" });

    await project.removeMember(userToRemove);

    res.json({ message: "User removed from project." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove member" });
  }
};

export const joinProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // 1. Check if already in team
    const isOwner = project.userId === userId;
    const isMember = await project.hasMember(userId);

    if (isOwner || isMember) {
      return res
        .status(400)
        .json({ message: "You are already in this project." });
    }

    // 2. Check Visibility
    if (project.visibility === "private") {
      return res
        .status(403)
        .json({ message: "This project is Private. You must be invited." });
    }

    // 3. Join!
    const user = await User.findByPk(userId);
    await project.addMember(user);

    res.json({ message: "Joined successfully!", project });
  } catch (error) {
    res.status(500).json({ message: "Failed to join project" });
  }
};
