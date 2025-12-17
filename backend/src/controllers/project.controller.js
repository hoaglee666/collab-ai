import Project from "../models/project.model.js";
import User from "../models/user.model.js";

//create project
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const project = await Project.create({
      name,
      description,
      userId,
      imageUrl,
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

//get all projects
export const getProjects = async (req, res) => {
  try {
    //const userId = req.user.id;
    //const projects = await Project.findAll({ where: { userId } });
    const projects = await Project.findAll({
      order: [["createdAt", "DESC"]], // Show newest first
      include: {
        model: User,
        attributes: ["username"], // Fetch the creator's name too!
      },
    });
    res.json(projects);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching projects", error: error.message });
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
