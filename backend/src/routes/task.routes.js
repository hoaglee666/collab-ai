// backend/src/routes/task.routes.js
import express from "express";
import {
  createTask,
  toggleTask,
  getTasks,
} from "../controllers/task.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Routes
router.post("/", verifyToken, createTask); // Add Task
router.get("/:projectId", verifyToken, getTasks); // Get List
router.patch("/:id/toggle", verifyToken, toggleTask); // Check/Uncheck

export default router;
