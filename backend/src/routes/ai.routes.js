import express from "express";
import { generateDescription } from "../controllers/ai.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/generate", verifyToken, generateDescription);

export default router;
