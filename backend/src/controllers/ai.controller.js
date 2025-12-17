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
