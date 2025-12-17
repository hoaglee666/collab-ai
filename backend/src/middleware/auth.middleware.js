// backend/src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // 1. Get token from header (Format: "Bearer <token>")
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    // 2. Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attach user info to the request object
    next(); // Continue to the controller
  } catch (error) {
    res.status(400).json({ message: "Invalid Token" });
  }
};
