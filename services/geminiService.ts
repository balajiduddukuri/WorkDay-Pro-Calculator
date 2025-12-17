import { GoogleGenAI, Type } from "@google/genai";
import { Holiday } from "../types";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchPublicHolidays = async (
  country: string,
  year: number,
  month: number
): Promise<Holiday[]> => {
  const modelId = "gemini-2.5-flash";
  
  // Month is 0-indexed in JS, but humans use 1-12
  const humanMonth = month + 1;
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  const prompt = `List all major public holidays for ${country} in ${monthName} ${year}. Return the specific date in YYYY-MM-DD format and the name of the holiday.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
              name: { type: Type.STRING, description: "Name of the holiday" },
            },
            required: ["date", "name"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];

    const holidays = JSON.parse(text) as Holiday[];
    return holidays;
  } catch (error) {
    console.error("Error fetching holidays from Gemini:", error);
    return [];
  }
};