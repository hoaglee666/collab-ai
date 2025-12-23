import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";
import ProjectMember from "./projectMember.model.js";

const Project = sequelize.define("Project", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deadline: {
    type: DataTypes.DATEONLY, //y-m-d
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("active", "completed", "archived", "abandoned"),
    defaultValue: "active",
  },
  //check who created
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  visibility: {
    type: DataTypes.ENUM("public", "private"),
    defaultValue: "public",
    allowNull: false,
  },
});

// 1. The Owner Relationship (Existing)
User.hasMany(Project, { foreignKey: "userId", as: "OwnedProjects" });
Project.belongsTo(User, { foreignKey: "userId", as: "Owner" }); // 'Owner' alias is very helpful

// 2. The Member Relationship (NEW!)
// This creates the "Join" table automatically
Project.belongsToMany(User, { through: ProjectMember, as: "Members" });
User.belongsToMany(Project, { through: ProjectMember, as: "JoinedProjects" });

export default Project;
