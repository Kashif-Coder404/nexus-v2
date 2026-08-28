import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const API_FOR_AUTHENTICATION = process.env.API_FOR_AUTHENTICATION;
const MONGO_URI = process.env.MONGO_URI;
const GROQ_KEY_COLLEGE_WISE = process.env.GROQ_KEY_COLLEGE_WISE;
const GROQ_KEY_BGMI_15 = process.env.GROQ_KEY_BGMI_15;
const OPEN_CODE = process.env.OPEN_CODE;
const GEMINI_API = process.env.GEMINI_API;
const GEMINI_API_CW = process.env.GEMINI_API_CW;
const GEMINI_API2 = process.env.GEMINI_API2;
const GEMINI_API3 = process.env.GEMINI_API3;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_ROUTER_API = process.env.TOKEN_ROUTER_API;

export {
  API_FOR_AUTHENTICATION,
  MONGO_URI,
  GROQ_KEY_COLLEGE_WISE,
  GROQ_KEY_BGMI_15,
  OPEN_CODE,
  GEMINI_API,
  GEMINI_API_CW,
  GEMINI_API2,
  GEMINI_API3,
  JWT_SECRET,
  TOKEN_ROUTER_API,
};

export const initializeKeys = async () => {
  dotenv.config({ path: path.resolve(__dirname, ".env") });
};
