// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http"; // <--- Import HTTP
import { Server } from "socket.io"; // <--- Import Socket.io
import sequelize from "./src/config/database.js";
import User from "./src/models/user.model.js";
import Project from "./src/models/project.model.js";
import Task from "./src/models/task.model.js";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./src/routes/auth.routes.js";
import projectRoutes from "./src/routes/project.routes.js";
import aiRoutes from "./src/routes/ai.routes.js";
import taskRoutes from "./src/routes/task.routes.js";
import Message from "./src/models/message.model.js";
import chatRoutes from "./src/routes/chat.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app); // <--- Wrap Express in HTTP Server
// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:4200", // Allow Angular Frontend
    methods: ["GET", "POST"],
  },
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Inject 'io' into every request so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/chat", chatRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Socket.io Logic
io.on("connection", (socket) => {
  console.log("⚡A user connected:", socket.id);
  // Join a "Room" based on Project ID
  socket.on("joinProject", (projectId) => {
    socket.join(projectId);
    console.log(`🚪User joined project room: ${projectId}`);
  });
  socket.on("disconnect", () => {
    console.log("🔌User disconnected:", socket.id);
  });
});

// Start Server (Change app.listen to httpServer.listen)
const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("✅ Database & Models synchronized.");

    httpServer.listen(PORT, () => {
      // <--- Use httpServer here
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database Error:", error);
  }
};

startServer();
