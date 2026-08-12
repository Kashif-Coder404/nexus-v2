import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { instructions } from "../instructions/Instructions.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { GeminiResponse } from "../Types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const GEMINI_API_KEY = process.env.GEMINI_API;

export const geminiAICall = async (
  chatMessages: Array<{ role: string; content: string }>,
  retryCount: number = 0,
  model: string = "gemini-3.5-flash",
  instructionString: string = instructions,
  isJson: boolean = true,
): Promise<GeminiResponse> => {
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

  // const model = "gemini-3.1-flash-lite";
  // const model = "gemini-1.5-pro";

  // From your screenshot: Webshare's Rotating Proxy Endpoint
  const proxy = `http://ykowtycz-rotate:9g9v96c9zsux@p.webshare.io:80/`;
  // const agent = new HttpsProxyAgent(proxy);
  const MessageToAI = [
    {
      role: "system",
      content: instructionString,
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
        ...(isJson && {
          response_format: {
            type: "json_object",
          },
        }),
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
    let parsedContent;
    if (isJson) {
      let cleanStr = messageContent.trim();
      if (cleanStr.startsWith("```json")) {
        cleanStr = cleanStr
          .replace(/^```json/, "")
          .replace(/```$/, "")
          .trim();
      } else if (cleanStr.startsWith("```")) {
        cleanStr = cleanStr.replace(/^```/, "").replace(/```$/, "").trim();
      }
      try {
        parsedContent = JSON.parse(cleanStr);
      } catch (parseError) {
        // Attempt to extract JSON if there's trailing garbage
        const match = cleanStr.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedContent = JSON.parse(match[0]);
          } catch (e) {
            throw parseError;
          }
        } else {
          throw parseError;
        }
      }
    } else {
      parsedContent = messageContent;
    }
    return {
      content: parsedContent,
      success: true,
    };
  } catch (error: any) {
    console.error("--- GEMINI API CALL FAILED ---");

    const isRateLimited = error.response && error.response.status === 429;

    // Check if the error is a JSON parsing error (SyntaxError)
    const isParseError = error instanceof SyntaxError;

    if (isRateLimited || isParseError) {
      console.log(
        `Gemini error (${isRateLimited ? "Rate Limited" : "JSON Parse Error"}). Retrying... (Retry ${retryCount + 1}/2)`,
      );
      return geminiAICall(
        chatMessages,
        retryCount + 1,
        model,
        instructionString,
        isJson,
      );
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
