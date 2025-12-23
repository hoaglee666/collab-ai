// backend/src/controllers/task.controller.js
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";

// 1. Create a Task manually
export const createTask = async (req, res) => {
  try {
    const { projectId, description, assigneeId } = req.body;
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
      assigneeId: assigneeId || null, //save
    });

    const taskWithAssignee = await Task.findByPk(task.id, {
      include: {
        model: User,
        as: "Assignee",
        attributes: ["username", "avatarUrl"],
      },
    });
    //emit
    req.io.to(projectId).emit("task:created", task);

    res.status(201).json(taskWithAssignee);
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

export const updateTask = async (req, res) => {
  // Rename toggleTask to updateTask for clarity
  try {
    const { id } = req.params;
    const { isCompleted, description, assigneeId } = req.body;

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // ✅ Only update if value is provided
    if (description !== undefined) task.description = description;
    if (assigneeId !== undefined) task.assigneeId = assigneeId;

    // ✅ Logic fix: If isCompleted is sent, use it. Otherwise, toggle it.
    if (isCompleted !== undefined) {
      task.isCompleted = isCompleted;
    } else {
      // Only toggle if isCompleted was NOT sent in body (legacy toggle behavior)
      // or you can remove this toggle logic if the frontend always sends true/false
      // task.isCompleted = !task.isCompleted;
    }

    await task.save();

    await task.reload({
      include: {
        model: User,
        as: "Assignee",
        attributes: ["username", "avatarUrl"],
      },
    });

    req.io.to(task.projectId).emit("task:updated", task);
    res.json(task);
  } catch (error) {
    // ...
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
      include: {
        model: User,
        as: "Assignee",
        attributes: ["id", "username", "avatarUrl"],
      },
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
