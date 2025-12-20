import express from "express";
import {
  generateDescription,
  generateTasks,
  chatWithAdvisor,
} from "../controllers/ai.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/generate", verifyToken, generateDescription);
router.post("/suggest-tasks", verifyToken, generateTasks);
router.post("/chat", verifyToken, chatWithAdvisor);
export default router;
