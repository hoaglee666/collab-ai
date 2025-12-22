import express from "express";
import { getSystemStats } from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { verifyAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

// Chain the guards: Login Check -> Admin Check -> Controller
router.get("/stats", verifyToken, verifyAdmin, getSystemStats);

export default router;
