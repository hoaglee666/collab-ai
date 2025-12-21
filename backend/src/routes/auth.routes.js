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
import passport from "passport";
import jwt from "jsonwebtoken";

// Helper to generate token and redirect to Frontend
const socialAuthCallback = (req, res) => {
  const user = req.user;
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );

  // Redirect to Frontend with token in URL
  const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";
  res.redirect(`${clientUrl}/login-success?token=${token}`);
};
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
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  socialAuthCallback
);
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/login",
  }),
  socialAuthCallback
);
export default router;
