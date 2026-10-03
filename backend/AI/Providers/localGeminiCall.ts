import axios from "axios";
import { instructions } from "../instructions/main.Instructions.js";
import type { ChatMessageType } from "../Types.ts";
import { GEMINI_WEB_2_URL } from "../../EnvVariables.js";
import { sendToUser } from "../../services/websocket.service.js";
import { extractJSON } from "../Parsers.js";
export type LocalGeminiModelsTypes =
  | "gemini-3.7-flash"
  | "gemini-3.1-pro"
  | "gemini-3.6-flash"
  | "gemini-3.5-flash-thinking";

export type GeminiServerState = "idle" | "booting" | "ready" | "error";
export let geminiServerState: GeminiServerState = "idle";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)); // hold the line function
export const localGeminiAICall = async ({
  chatMessages,
  model = "gemini-3.7-flash",
  instructionString = instructions,
  userId,
  isJson = true,
}: {
  chatMessages: ChatMessageType[];
  model?: string;
  instructionString?: string;
  userId?: string;
  isJson?: boolean;
}): Promise<{
  content: {
    cmd: string;
    msg: string;
    workingon: string;
  };
  success: boolean;
}> => {
  const baseUrl = (GEMINI_WEB_2_URL || "http://127.0.0.1:8081").replace(
    /\/+$/,
    "",
  );
  console.log("[Local Gemini URL]: ", baseUrl);
  const localApiUrl = `${baseUrl}/v1/chat/completions`;

  // Build OpenAI-compatible messages array
  const messagesPayload = [
    {
      role: "system",
      content: instructionString,
    },
    ...chatMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];
  let response: any = null;
  let ticker: NodeJS.Timeout | null = null;
  let coldStart: NodeJS.Timeout | null = null;
  let estimatedSeconds: number = 45;
  try {
    coldStart = setTimeout(() => {
      geminiServerState = "booting";
      if (userId) {
        sendToUser(userId, {
          type: "ai_data",
          data: {
            workingon: `Waking up AI server (~${estimatedSeconds}s remaining)...`,
            msg: "",
            cmd: "",
          },
        });
      }
      ticker = setInterval(() => {
        estimatedSeconds = Math.max(5, estimatedSeconds - 1);
        if (userId) {
          sendToUser(userId, {
            type: "ai_data",
            data: {
              workingon: `Waking up AI server (~${estimatedSeconds}s remaining)...`,
              msg: "",
              cmd: "",
            },
          });
        }
      }, 1000);
    }, 10000);
    response = await axios.post(
      localApiUrl,
      {
        model: model || "gemini-3.7-flash",
        messages: messagesPayload,
        temperature: 0.2,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      },
    );
    geminiServerState = "ready";
  } catch (error: any) {
    geminiServerState = "error";
    return {
      success: false,
      content: {
        cmd: "",
        msg: `Gemini Web2API error: ${error?.message || "Server unreachable"}`,
        workingon: "",
      },
    };
  } finally {
    if (coldStart) {
      clearTimeout(coldStart);
    }
    if (ticker) {
      clearInterval(ticker);
    }
  }

  // Parse the successful response
  let rawText = response?.data?.choices?.[0]?.message?.content || "";

  // 1. Strip thinking tags <thought>...</thought> if thinking model was used
  rawText = rawText.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();

  // 2. Parse structured JSON using resilient extractor
  if(!isJson){
    return {
      success: true,
      content: {
        cmd: "",
        msg: rawText,
        workingon: "",
      }
    }
  }
  const parsed = extractJSON(rawText);

  if (parsed && typeof parsed === "object") {
    return {
      success: true,
      content: {
        cmd: parsed.cmd || "",
        msg: parsed.msg || "",
        workingon: parsed.workingon || (parsed.cmd ? "Executing..." : ""),
      },
    };
  }

  // 3. Fallback if no JSON could be parsed or salvaged: strip any brackets so raw JSON syntax never leaks into the UI
  const cleanFallbackText = rawText.replace(/\{[\s\S]*\}/, "").trim();

  return {
    success: true,
    content: {
      cmd: "",
      msg: cleanFallbackText || rawText,
      workingon: "",
    },
  };
};
