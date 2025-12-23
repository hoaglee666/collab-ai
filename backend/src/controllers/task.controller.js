// backend/src/controllers/task.controller.js
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";

// 1. Create a Task manually
export const createTask = async (req, res) => {
  try {
    const { projectId, description } = req.body;
    const project = await Project.findByPk(projectId);
    if (project.status !== "active") {
      return res.status(403).json({
        message:
          "Project is archived/completed/abandoned. Restore to active to add tasks",
      });
    }
    const task = await Task.create({
      projectId,
      description,
    });
    //emit
    req.io.to(projectId).emit("task:created", task);

    res.status(201).json(task);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding task", error: error.message });
  }
};

// 2. Toggle Task Status (Check/Uncheck)
export const toggleTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.isCompleted = !task.isCompleted;
    await task.save();

    // 🔥 EMIT EVENT
    // We send the whole task so UI can update the status
    req.io.to(task.projectId).emit("task:updated", task);

    res.json(task);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating task", error: error.message });
  }
};

// 3. Get Tasks for a Project
export const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id; // 1. Get current user ID

    // 2. Fetch Project FIRST to check permissions
    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 3. Calculate Permissions
    const isOwner = project.userId === userId;

    // Sequelize provides 'hasMember' automatically because of your associations!
    const isMember = await project.hasMember(userId);

    // 4. Security Check
    if (project.visibility === "private" && !isOwner && !isMember) {
      return res
        .status(403)
        .json({ message: "Cannot view tasks of private project" });
    }

    // 5. Fetch Tasks (Only if allowed)
    const tasks = await Task.findAll({
      where: { projectId },
      order: [["createdAt", "ASC"]],
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the task first (we need to check the project status)
    const task = await Task.findByPk(id, { include: "Project" }); // Ensure 'Project' is the correct alias in your models

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 2. Security Check: Is project active?
    if (task.Project.status !== "active") {
      return res.status(403).json({ message: "Project is read-only." });
    }

    // 3. Delete it
    await task.destroy();

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting task" });
  }
};
