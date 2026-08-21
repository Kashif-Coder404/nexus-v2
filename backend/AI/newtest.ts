import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: "backend/.env" });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });
async function main() {
  const res = await ai.models.list();
  for await (const m of res) {
    console.log(m.name, m.supportedGenerationMethods);
  }
}
main();
