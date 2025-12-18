import express from "express";
import { sendMessage, getMessages } from "../controllers/chat.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:projectId", verifyToken, sendMessage);
router.get("/:projectId", verifyToken, getMessages);

export default router;
