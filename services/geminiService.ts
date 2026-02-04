import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskType, TaskStatus } from "../types";

// Helper to get today's date in YYYY-MM-DD format for reference in prompts
const getTodayString = () => new Date().toISOString().split('T')[0];

export const parseSyllabusWithGemini = async (
  imageBase64: string | null,
  textContext: string
): Promise<Task[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    throw new Error("API Key is missing. Please select a paid API key to use AI features.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an intelligent study planner assistant. 
    Analyze the provided syllabus (image or text) and extract a list of actionable study tasks, exams, and assignments.
    
    Current Date: ${getTodayString()}
    
    Rules:
    1. Identify specific deliverables (Assignments, Exams) and their due dates.
    2. Create "Study Session" tasks for major topics found in the syllabus. Schedule them a few days before the relevant exam or assignment if possible, otherwise spread them out starting from tomorrow.
    3. If specific dates aren't mentioned (e.g., "Week 5"), estimate the date based on the Current Date assuming the semester started recently or is ongoing.
    4. Return a JSON array.
    
    Output Schema:
    Array of objects with:
    - title: string
    - subject: string (Course name)
    - dueDate: string (YYYY-MM-DD format)
    - type: one of "ASSIGNMENT", "EXAM", "STUDY_SESSION"
    - priority: "high" for exams, "medium" for assignments, "low" for study sessions.
    - durationMinutes: number (estimate 60 for study, 120 for exams/assignments prep)
  `;

  const parts: any[] = [{ text: prompt }];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/png", // Assuming PNG/JPEG, API is flexible with standard image types
        data: imageBase64,
      },
    });
  }

  if (textContext) {
    parts.push({ text: `Additional User Notes/Syllabus Text: ${textContext}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subject: { type: Type.STRING },
              dueDate: { type: Type.STRING },
              type: { type: Type.STRING },
              priority: { type: Type.STRING },
              durationMinutes: { type: Type.NUMBER },
            },
            required: ["title", "subject", "dueDate", "type", "priority"],
          },
        },
      },
    });

    const jsonString = response.text;
    if (!jsonString) return [];

    const rawTasks = JSON.parse(jsonString);

    // Map to our internal Task type with IDs
    return rawTasks.map((t: any) => ({
      ...t,
      id: crypto.randomUUID(),
      status: TaskStatus.TODO,
      type: t.type as TaskType, // trusting AI to match enum string roughly, or default
    }));

  } catch (error) {
    console.error("Gemini Syllabus Parse Error:", error);
    throw error;
  }
};

export const suggestRescheduling = async (
  missedTasks: Task[],
  existingTasks: Task[]
): Promise<Task[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return missedTasks; // Fallback

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    I have missed the following tasks: ${JSON.stringify(missedTasks.map(t => t.title))}.
    My current schedule for the next few days has these tasks: ${JSON.stringify(existingTasks.filter(t => new Date(t.dueDate) > new Date()).slice(0, 10).map(t => ({ title: t.title, date: t.dueDate })))}.
    
    Suggest new dates for the missed tasks. Prioritize finding gaps. Do not schedule more than 3 high priority tasks in one day.
    Return a JSON array of objects containing { "taskId": "original_id", "newDate": "YYYY-MM-DD" }.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const suggestionMap = JSON.parse(response.text || "[]");
    
    // Apply suggestions
    return missedTasks.map(task => {
      const suggestion = suggestionMap.find((s: any) => s.taskId === task.id);
      if (suggestion) {
        return { ...task, dueDate: suggestion.newDate };
      }
      // Fallback: move to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { ...task, dueDate: tomorrow.toISOString().split('T')[0] };
    });

  } catch (e) {
    console.error("Reschedule Error", e);
    // Fallback logic
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return missedTasks.map(t => ({ ...t, dueDate: tomorrow.toISOString().split('T')[0] }));
  }
};
