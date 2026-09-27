import axios from "axios";
import { instructions } from "../instructions/main.Instructions.js";
import type { ChatMessageType } from "../Types.ts";
import { GEMINI_WEB_2_URL } from "../../EnvVariables.js";
export type LocalGeminiModelsTypes =
  | "gemini-3.7-flash"
  | "gemini-3.1-pro"
  | "gemini-3.6-flash"
  | "gemini-3.5-flash-thinking";

export const localGeminiAICall = async ({
  chatMessages,
  model = "gemini-3.7-flash",
  instructionString = instructions,
}: {
  chatMessages: ChatMessageType[];
  model?: string;
  instructionString?: string;
}): Promise<{
  content: {
    cmd: string;
    msg: string;
    workingon: string;
  };
  success: boolean;
}> => {
  const baseUrl = (GEMINI_WEB_2_URL || "http://127.0.0.1:8081").replace(/\/+$/, "");
  const localApiUrl = `${baseUrl}/v1/chat/completions`;

  // Build OpenAI-compatible messages array
  const messagesPayload = [
    {
      role: "system",
      content: instructionString,
    },
    ...chatMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content:
        typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    })),
  ];

  try {
    const response = await axios.post(
      localApiUrl,
      {
        model: model || "gemini-3.7-flash",
        messages: messagesPayload,
        temperature: 0.2,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 180000, // 3 minutes timeout for heavy local queries
      },
    );

    let rawText = response.data?.choices?.[0]?.message?.content || "";

    // 1. Strip thinking tags <thought>...</thought> if thinking model was used
    rawText = rawText.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();

    // 2. Strip Markdown code fences if model returned ```json ... ```
    const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      rawText = codeBlockMatch[1].trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Fallback if not pure JSON
      parsed = {
        cmd: "",
        msg: rawText,
        workingon: "Thinking...",
      };
    }

    return {
      success: true,
      content: {
        cmd: parsed.cmd || "",
        msg: parsed.msg || rawText,
        workingon: parsed.workingon || "Executing...",
      },
    };
  } catch (error: any) {
    console.error("[LOCAL GEMINI ERROR]:", error?.message || error);
    return {
      success: false,
      content: {
        cmd: "",
        msg: `Local Gemini Web2API Error: ${error?.message || "Failed to reach " + baseUrl}. Is the Web2API service running?`,
        workingon: "",
      },
    };
  }
};
