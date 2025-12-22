// backend/src/routes/project.routes.js
import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  getMyProjects,
  deleteProject,
  updateProject,
  addMember,
  removeMember,
} from "../controllers/project.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js"; // <--- Secure it!
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
// Apply verifyToken so only logged-in users can hit these routes
router.post("/", verifyToken, upload.single("image"), createProject);
router.get("/", verifyToken, getProjects);
router.get("/my", verifyToken, getMyProjects);
router.get("/:id", verifyToken, getProjectById);
router.put("/:id", verifyToken, upload.single("image"), updateProject);
router.delete("/:id", verifyToken, deleteProject);
router.post("/:id/members", verifyToken, addMember); // Add by email
router.delete("/:id/members/:userId", verifyToken, removeMember); // Kick by ID

export default router;
