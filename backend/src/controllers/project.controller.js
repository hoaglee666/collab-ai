import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import { Op } from "sequelize";

//create project
export const createProject = async (req, res) => {
  try {
    const { name, description, deadline } = req.body;
    const userId = req.user.id;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const project = await Project.create({
      name,
      description,
      userId,
      imageUrl,
      deadline,
    });

    // req.io.emit('project:created', project);
    // ^ IMPORTANT: We need to fetch the User info before emitting,
    // otherwise the real-time update won't show the "Created By" name immediately.
    // Let's do a quick reload of the project with the User included.
    const projectWithUser = await Project.findByPk(project.id, {
      include: { model: User, attributes: ["username"] }, // Don't forget to import User if not imported!
    });

    req.io.emit("project:created", projectWithUser);

    res.status(201).json(project);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating project", error: error.message });
  }
};

//get all projects (public community)
export const getProjects = async (req, res) => {
  try {
    // 1. Read Query Params (with defaults)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // 6 items per page
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order || "DESC";

    // 2. Calculate Offset (Skip)
    const offset = (page - 1) * limit;

    // 3. Build Search Condition
    const searchCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
            // NEW: Search by Creator Name
            { "$User.username$": { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    // 4. Fetch Data + Total Count (findAndCountAll is magic!)
    const { count, rows } = await Project.findAndCountAll({
      where: searchCondition,
      include: {
        model: User,
        attributes: ["username", "avatarUrl"], // Include avatar for UI
      },
      order: [[sortBy, order]],
      limit: limit,
      offset: offset,
    });

    // 5. Return Data + Pagination Info
    res.json({
      projects: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error); // Log for debugging
    res.status(500).json({ message: "Error fetching projects" });
  }
};

//get mine
export const getMyProjects = async (req, res) => {
  try {
    const userId = req.user.id; // From Token
    const projects = await Project.findAll({
      where: { userId }, // <--- FILTER BY USER
      order: [["createdAt", "DESC"]],
      include: { model: User, attributes: ["username", "avatarUrl"] },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching my projects" });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: {
        model: User,
        attributes: ["username"],
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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
    await project.destroy(); //delete project and tasks
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting project", error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, status, deadline } = req.body;

    const project = await Project.findOne({ where: { id, userId } });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    // Update text fields
    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (deadline) project.deadline = deadline;

    // NEW: Update Image if a file was uploaded
    if (req.file) {
      project.imageUrl = `/uploads/${req.file.filename}`;
    }

    await project.save();

    res.json({ message: "Project updated", project });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};
