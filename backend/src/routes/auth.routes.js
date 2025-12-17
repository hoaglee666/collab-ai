import express from "express";
import {
  register,
  login,
  updateProfile,
  deleteAccount,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/profile", verifyToken, updateProfile);
router.delete("/", verifyToken, deleteAccount);
export default router;
