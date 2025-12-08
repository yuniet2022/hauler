
import { GoogleGenAI } from "@google/genai";

// Truco para que TS no pida @types/node
declare const process: any;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSmartQuote = async (origin: string, destination: string, vehicle: string, isInoperable: boolean): Promise<number> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning mock quote.");
    return 850;
  }
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Estimate a fair shipping price in USD for transporting a ${vehicle} from ${origin} to ${destination}. The vehicle is ${isInoperable ? 'INOPERABLE (needs winch)' : 'OPERABLE'}. Return ONLY the number (integer).`;
    const response = await ai.models.generateContent({ model: model, contents: prompt });
    const text = response.text || '';
    const price = parseFloat(text.replace(/[^0-9.]/g, ''));
    return isNaN(price) ? 900 : price;
  } catch (error) {
    console.error("Gemini Quote Error:", error);
    return 950;
  }
};
