// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
// Asegúrate de tener esta variable en tu `.env`
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("❌ Falta la variable de entorno GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generarRespuesta(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}
