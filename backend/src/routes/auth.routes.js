import express from "express";
import {
  register,
  login,
  updateProfile,
  deleteAccount,
  uploadAvatar,
  getProfile,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import multer from "multer";

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post("/register", register);
router.post("/login", login);
router.put("/profile", verifyToken, updateProfile);
router.delete("/", verifyToken, deleteAccount);
router.post("/avatar", verifyToken, upload.single("avatar"), uploadAvatar);
router.get("/profile", verifyToken, getProfile);
export default router;
