import axios from "axios";
import { instructions } from "../instructions/main.Instructions.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { GeminiResponse } from "../Types.js";
import { GoogleGenAI, Modality } from "@google/genai";
import {
  GEMINI_API,
  GEMINI_API_CW,
  GEMINI_API2,
  GEMINI_API3,
} from "../../EnvVariables.js";

const GEMINI_API_KEYS = [
  GEMINI_API,
  GEMINI_API_CW,
  GEMINI_API2,
  GEMINI_API3,
].filter(Boolean) as string[];
export type GeminiModelsTypes =
  | "gemini-3.5-flash-lite"
  | "gemini-3.5-flash"
  | "gemini-3.1-flash-lite"
  | "gemini-3.1-flash-live-preview";
type GeminiAICallOptions = {
  chatMessages: Array<{ role: string; content: string }>;
  retryCount: number;
  model: GeminiModelsTypes | string;
  instructionString: string;
  isJson: boolean;
  keyIndex?: number;
};
export const geminiAICall = async ({
  chatMessages,
  retryCount = 0,
  model = "gemini-3.5-flash-lite",
  instructionString = instructions,
  isJson = true,
  keyIndex = 1,
}: GeminiAICallOptions): Promise<GeminiResponse> => {
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
      if (retryCount < 2) {
        console.log(
          `Gemini error (${isRateLimited ? "Rate Limited" : "JSON Parse Error"}). Retrying with next key... (Retry ${retryCount + 1}/2)`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return geminiAICall({
          chatMessages,
          retryCount: retryCount + 1,
          model,
          instructionString,
          isJson,
          keyIndex: (keyIndex + 1) % GEMINI_API_KEYS.length,
        });
      }
    }

    let userFriendlyMsg = "AI service encountered an unexpected error. Please try again.";
    const status = error.response?.status;
    const errorMsg = error.message || "";
    const errorData = JSON.stringify(error.response?.data || "");

    if (status === 429 || errorData.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
      userFriendlyMsg = "AI request limit or quota exceeded. Please wait a few moments before trying again.";
    } else if (status === 401 || status === 403) {
      userFriendlyMsg = "AI authentication error. Please verify your API key in configuration.";
    } else if (status === 503 || status === 500 || error.code === "ECONNABORTED") {
      userFriendlyMsg = "AI service is currently busy or experiencing high traffic. Please try again shortly.";
    } else if (error instanceof SyntaxError) {
      userFriendlyMsg = "AI response format was invalid. Please try rephrasing your request.";
    }

    if (error.response) {
      console.error("[GEMINI AI] Status:", error.response.status);
    } else {
      console.error("[GEMINI AI] Error:", error.message);
    }

    return {
      success: false,
      content: {
        cmd: "",
        msg: userFriendlyMsg,
        workingon: "",
      },
    };
  }
};

export const liveGeminiAICall = async (
  // chatMessages,
  // retryCount = 0,
  // model = "gemini-3.1-flash-live-preview",
  // instructionString = instructions,
  // isJson = true,
  // keyIndex = 1,
  msg: string,
) => {
  let session: any;
  let fullResponseText = "";
  let resolveResponse: any;
  let rejectResponse: any;

  const responsePromise = new Promise((resolve, reject) => {
    resolveResponse = resolve;
    rejectResponse = reject;
  });
  const ai: any = new GoogleGenAI({
    apiKey: GEMINI_API_KEYS[1],
  });
  try {
    session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: ["AUDIO" as Modality],
        outputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: any) => {},
      },
    });
  } catch (error) {
    console.error("Error connecting to Gemini Live API:", error);
    throw error;
  }
};
