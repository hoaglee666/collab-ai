import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Project from "./project.model.js";

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
});

Project.hasMany(Task, { foreignKey: "projectId", onDelete: "CASCADE" });
Task.belongsTo(Project, { foreignKey: "projectId" });

export default Task;
