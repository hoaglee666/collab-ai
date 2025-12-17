// backend/src/controllers/task.controller.js
import Task from "../models/task.model.js";

// 1. Create a Task manually
export const createTask = async (req, res) => {
  try {
    const { projectId, description } = req.body;

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
    const tasks = await Task.findAll({
      where: { projectId },
      order: [["createdAt", "ASC"]],
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks" });
  }
};
