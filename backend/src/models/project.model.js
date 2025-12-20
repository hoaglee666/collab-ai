import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";

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
});

//define relation: 1 user - many projects
User.hasMany(Project, { foreignKey: "userId" });
Project.belongsTo(User, { foreignKey: "userId" });

export default Project;
