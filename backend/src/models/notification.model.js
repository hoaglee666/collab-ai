import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";

const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    // Who receives this notification
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    // 'message', 'deadline', 'system'
    type: DataTypes.STRING,
    defaultValue: "system",
  },
  message: {
    // The text (e.g., "John sent a message")
    type: DataTypes.STRING,
    allowNull: false,
  },
  link: {
    // Where to go when clicked (e.g., "/projects/123")
    type: DataTypes.STRING,
    allowNull: true,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// Relationships
User.hasMany(Notification, { foreignKey: "userId" });
Notification.belongsTo(User, { foreignKey: "userId" });

export default Notification;
