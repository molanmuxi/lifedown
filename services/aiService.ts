import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const suggestTasks = async (currentTasks: string[]): Promise<string[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key available for AI suggestions");
    return ["Buy groceries", "Study for exam", "Call mom"];
  }

  try {
    const prompt = `
      I have a to-do list. Based on general productivity, suggest 3 concise tasks that might be missing or helpful for a student/professional.
      Current tasks: ${currentTasks.join(', ')}.
      Return only the tasks separated by newlines. No formatting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    return text.split('\n').filter(t => t.trim().length > 0).map(t => t.replace(/^- /, '').trim());
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
};
