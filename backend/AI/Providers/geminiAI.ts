import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { instructions } from "../instructions/main.Instructions.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { GeminiResponse } from "../Types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const GEMINI_API_KEYS = [process.env.GEMINI_API, process.env.GEMINI_API_CW];
export const geminiAICall = async (
  chatMessages: Array<{ role: string; content: string }>,
  retryCount: number = 0,
  model: string = "gemini-3.5-flash-lite",
  instructionString: string = instructions,
  isJson: boolean = true,
  keyIndex: number = 1,
): Promise<GeminiResponse> => {
  const Current_API_KEY = GEMINI_API_KEYS[keyIndex];
  console.log(`[GEMINI AI CALL] Model: ${model} | Retry: ${retryCount}`);
  if (retryCount >= GEMINI_API_KEYS.length) {
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
  // const proxy = `http://ykowtycz-rotate:9g9v96c9zsux@p.webshare.io:80/`;
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
          Authorization: `Bearer ${Current_API_KEY}`,
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
    console.error("[GEMINI AI] API CALL FAILED");

    const isRateLimited = error.response && error.response.status === 429;

    // Check if the error is a JSON parsing error (SyntaxError)
    const isParseError = error instanceof SyntaxError;

    if (isRateLimited || isParseError) {
      console.log(
        `Gemini error (${isRateLimited ? "Rate Limited" : "JSON Parse Error"}). Retrying... (Retry ${retryCount + 1}/2)`,
      );
      // console.log("Current API Key Index => ", keyIndex);
      console.log("Error Message => ", error.message);
      console.log("Error Details => ", error.response.data);
      console.log("Waiting for 5 seconds before retry...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return geminiAICall(
        chatMessages,
        retryCount + 1,
        model,
        instructionString,
        isJson,
        (keyIndex + 1) % GEMINI_API_KEYS.length,
      );
    }
    if (error.response) {
      console.error("[GEMINI AI] Status:", error.response.status);
      console.error(
        "[GEMINI AI] Error Details:",
        JSON.stringify(error.response.data, null, 2),
      );
    } else {
      console.error("[GEMINI AI] Error Message:", error.message);
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
