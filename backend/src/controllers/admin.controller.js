import User from "../models/user.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";

export const getSystemStats = async (req, res) => {
  try {
    // 1. Run all counts in parallel for speed
    const [userCount, projectCount, taskCount, activeProjects] =
      await Promise.all([
        User.count(),
        Project.count(),
        Task.count(),
        Project.count({ where: { status: "active" } }),
      ]);

    // 2. Get recent users (last 5)
    const recentUsers = await User.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "username", "email", "createdAt"], // Don't send passwords!
    });

    res.json({
      totalUsers: userCount,
      totalProjects: projectCount,
      totalTasks: taskCount,
      activeProjects: activeProjects,
      recentUsers: recentUsers,
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
};
