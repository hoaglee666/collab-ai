// backend/src/routes/project.routes.js
import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  getMyProjects,
} from "../controllers/project.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js"; // <--- Secure it!
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save to uploads folder
  },
  filename: (req, file, cb) => {
    // Name file: timestamp-originalName (e.g., 123456-my-pic.png)
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });
// Apply verifyToken so only logged-in users can hit these routes
router.post("/", verifyToken, upload.single("image"), createProject);
router.get("/", verifyToken, getProjects);
router.get("/my", verifyToken, getMyProjects);
router.get("/:id", verifyToken, getProjectById);
export default router;
