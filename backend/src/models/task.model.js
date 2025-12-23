import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Project from "./project.model.js";
import User from "./user.model.js";

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assigneeId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
});

Project.hasMany(Task, { foreignKey: "projectId", onDelete: "CASCADE" });
Task.belongsTo(Project, { foreignKey: "projectId" });

Task.belongsTo(User, { as: "Assignee", foreignKey: "assigneeId" });
User.hasMany(Task, { foreignKey: "assigneeId", as: "AssignedTasks" });
export default Task;
