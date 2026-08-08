import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { instructions } from "../instructions/Instructions.js";
import { HttpsProxyAgent } from "https-proxy-agent";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const GEMINI_API_KEY = process.env.GEMINI_API;

export const geminiAICall = async (
  chatMessages: Array<{ role: string; content: string }>,
  retryCount: number = 0,
): Promise<{
  content: {
    cmd: string;
    msg: string;
    workingon: string;
  };
  success: boolean;
}> => {
  if (retryCount >= 2) {
    return {
      success: false,
      content: {
        cmd: "",
        msg: "Gemini API Failed or Rate Limited!",
        workingon: "",
      },
    };
  }

  // Use a valid Gemini model for the OpenAI-compatible endpoint
  const model = "gemini-3.1-flash-lite";

  // From your screenshot: Webshare's Rotating Proxy Endpoint
  const proxy = `http://ykowtycz-rotate:9g9v96c9zsux@p.webshare.io:80/`;
  const agent = new HttpsProxyAgent(proxy);

  const MessageToAI = [
    {
      role: "system",
      content: instructions,
    },
    ...chatMessages,
  ];
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        model: model,
        messages: MessageToAI,
        temperature: 0.5,
        response_format: {
          type: "json_object",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        // uncomment if you want to use the proxy
        // httpsAgent: agent,
      },
    );

    const messageContent = response.data.choices[0].message.content;
    const parsedContent =
      typeof messageContent === "string"
        ? JSON.parse(messageContent)
        : messageContent;

    return {
      content: parsedContent,
      success: true,
    };
  } catch (error: any) {
    console.error("--- GEMINI API CALL FAILED ---");
    const isRateLimited = error.response && error.response.status === 429;

    if (isRateLimited) {
      console.log(
        `Gemini rate limited. Retrying... (Retry ${retryCount + 1}/2)`,
      );
      return geminiAICall(chatMessages, retryCount + 1);
    }
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error(
        "Error Details:",
        JSON.stringify(error.response.data, null, 2),
      );
    } else {
      console.error("Error Message:", error.message);
    }
    return {
      success: false,
      content: {
        cmd: "",
        msg: "Gemini API Failed!",
        workingon: "",
      },
    };
  }
};
