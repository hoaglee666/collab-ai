import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";
import Notification from "../models/notification.model.js";
import { Op } from "sequelize";

// 1. Send Message
export const sendMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.create({ content, projectId, userId });
    const project = await Project.findByPk(projectId);
    if (project.status !== "active") {
      return res.status(403).json({ message: "Project is read-only" });
    }
    const previousMessages = await Message.findAll({
      where: { projectId },
      attributes: ["userId"], // Only fetch user IDs
    });
    // Create a Set to ensure unique IDs (no duplicates)
    const recipientIds = new Set();
    // Add Project Owner (Always notify owner, unless it's me)
    if (project.userId !== userId) {
      recipientIds.add(project.userId);
    }

    // Add everyone else who has chatted before
    previousMessages.forEach((msg) => {
      if (msg.userId !== userId) {
        // Don't notify myself
        recipientIds.add(msg.userId);
      }
    });
    for (const recipientId of recipientIds) {
      // Create DB Record
      const notif = await Notification.create({
        userId: recipientId,
        type: "message",
        message: `New message in ${project.name}`,
        // ✨ TRICK: Add a query param '?jump=chat' to the link
        link: `/projects/${projectId}?jump=chat`,
      });

      // Real-time Emit (Socket)
      req.io.to(`user:${recipientId}`).emit("notification:new", notif);
    }
    // Fetch user details to send with the socket event (so we see the username immediately)
    const fullMessage = await Message.findByPk(message.id, {
      include: { model: User, attributes: ["username", "avatarUrl"] },
    });

    // 🔥 Emit to Room
    req.io.to(projectId).emit("message:sent", fullMessage);

    res.status(201).json(fullMessage);
  } catch (error) {
    res.status(500).json({ message: "Error sending message" });
  }
};

// 2. Get History
export const getMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const messages = await Message.findAll({
      where: { projectId },
      include: { model: User, attributes: ["username", "avatarUrl"] },
      order: [["createdAt", "ASC"]], // Oldest first (like standard chat)
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
};
