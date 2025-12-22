export const verifyAdmin = (req, res, next) => {
  //verifytoken run before this, so req.user exists
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};
