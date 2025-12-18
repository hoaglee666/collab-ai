import Message from "../models/message.model.js";
import User from "../models/user.model.js";

// 1. Send Message
export const sendMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.create({ content, projectId, userId });

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
