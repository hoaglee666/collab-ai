import Notification from "../models/notification.model.js";

// 1. Get My Notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]], // Newest first
      limit: 20, // Don't fetch too many
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// 2. Mark as Read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);

    if (notification && notification.userId === req.user.id) {
      notification.isRead = true;
      await notification.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification" });
  }
};
