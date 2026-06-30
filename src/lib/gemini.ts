/**
 * Google Gemini API Client Helper
 * 
 * This file is prepared for the new Google Gen AI SDK (`@google/genai`).
 * 
 * SETUP INSTRUCTIONS:
 * 1. Install the SDK:
 *    npm install @google/genai
 * 
 * 2. Ensure GEMINI_API_KEY is set in your `.env.local` file.
 * 
 * 3. Uncomment the import and active client code below to start using Gemini.
 */

// ==========================================
// UNCOMMENT THE FOLLOWING CODE AFTER RUNNING:
// npm install @google/genai
// ==========================================
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not defined in your environment variables.");
}

// Initialize the Google Gen AI SDK client
export const ai = new GoogleGenAI({ apiKey });

// Helper to generate text from a prompt
export async function generateText(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text with Gemini SDK:", error);
    throw error;
  }
}
