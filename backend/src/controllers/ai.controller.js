import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

//init gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export const generateDescription = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Missing GEMINI_API_KEY" });
    }
    const { projectName } = req.body;
    if (!projectName) {
      return res.status(400).json({ message: "Project name is required" });
    }
    //prompt
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

// backend/src/controllers/ai.controller.js

// ... existing generateDescription ...

export const generateTasks = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res
        .status(400)
        .json({ message: "Project description is required" });
    }

    // Prompt for the AI
    const prompt = `Based on this project description: "${description}", generate 5 short, actionable technical tasks. Return ONLY a JSON array of strings, like ["Task 1", "Task 2"]. Do not add markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up if AI adds markdown code blocks (```json ... ```)
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const tasks = JSON.parse(text); // Convert string to real Array

    res.json({ tasks });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "Failed to generate tasks" });
  }
};
