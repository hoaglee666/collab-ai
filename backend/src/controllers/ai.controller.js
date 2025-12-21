import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";

dotenv.config();

// Initialize Gemini (Global)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Note: You can switch models here (e.g., "gemini-1.5-flash" or "gemini-1.5-pro")
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// 1. Generate Project Description (Used when creating a project)
export const generateDescription = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Missing GEMINI_API_KEY" });
    }
    const { projectName } = req.body;
    if (!projectName) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const prompt = `Write a short, professional, and exciting project description (max 2 sentences) for a software project named "${projectName}".`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ suggestion: text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "Failed to generate AI content" });
  }
};

// 2. Generate Tasks (The Auto-Plan Feature)
export const generateTasks = async (req, res) => {
  try {
    // Only get description & ID from frontend (we get Name from DB)
    const { description, projectId } = req.body;

    // A. Validate Input
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // B. Fetch Project
    const project = await Project.findByPk(projectId);

    // C. Security Checks
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.status !== "active") {
      return res.status(403).json({
        message:
          "Project is completed/archived/abandoned. Please restore it to use.",
      });
    }

    // We allow description to be empty if the project has a name,
    // but usually description is helpful.
    if (!description) {
      return res
        .status(400)
        .json({ message: "Project description is required" });
    }

    // --- AI Logic ---
    // ✅ FIX: We now use project.name from the DB in the prompt
    const prompt = `
      Project Title: "${project.name}"
      Description: "${description}"
      
      Based on this, generate 5 short, actionable technical tasks. 
      Return ONLY a JSON array of strings, like ["Task 1", "Task 2"]. 
      Do not add markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown if AI adds it
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const tasks = JSON.parse(text);

    res.json({ tasks });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "Failed to generate tasks" });
  }
};

// 3. Chat with Advisor (The Floating Bot)
export const chatWithAdvisor = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Fetch user real context
    const projects = await Project.findAll({
      where: { userId },
      include: [{ model: Task }],
    });

    // Summarize data for AI
    const projectSummary = projects
      .map((p) => {
        const totalTasks = p.Tasks.length;
        const completedTasks = p.Tasks.filter((t) => t.isCompleted).length;
        const progress =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return `> Project: "${p.name}"
      > Status: ${p.status}
      > Deadline: ${p.deadline || "No deadline"}
      > Progress: ${progress}% (${completedTasks}/${totalTasks} tasks)
      > Description: ${p.description || "N/A"}`;
      })
      .join("\n");

    // System Prompt
    const systemPrompt = `
      You are an expert Project Management Advisor named "CollabBot".
      You are talking to the user about their specific projects.
      
      HERE IS THE USER'S CURRENT DATA:
      ${projectSummary}

      USER'S QUESTION: "${message}"

      INSTRUCTIONS:
      - Use the provided data to give specific advice.
      - If they ask "What should I do?", look for projects with close deadlines or low progress.
      - Be encouraging but practical.
      - Keep answers concise (under 100 words if possible).
      - If they have no projects, tell them to create one.
      `;

    // Re-use the global model instance (No need to init again)
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error("AI error:", error);
    res
      .status(500)
      .json({ message: "AI advisor is offline bud.", error: error.message });
  }
};
