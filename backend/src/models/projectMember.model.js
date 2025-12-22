import { DataTypes } from "sequelize";
import sequelize from "../config/database.js"; // Adjust path if needed

const ProjectMember = sequelize.define("ProjectMember", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "member", // 'member', 'viewer' (Future proofing)
  },
});

export default ProjectMember;
