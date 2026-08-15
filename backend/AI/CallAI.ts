import { callNvidia } from "./Providers/nvidiaAPICall.js";
import { geminiAICall } from "./Providers/geminiAI.js";
import { instructions as defaultInstructions } from "./instructions/main.Instructions.js";
import type { ChatMessageType } from "./Types.ts";

export type AIName = "nvidia" | "gemini";

export type AIProviderParams = {
  chatMessages: ChatMessageType[];
  session: string;
  instructions?: string;
  isJson?: boolean;

  // Specific to Gemini
  retryCount?: number;
  model?: string;

  // Specific to Nvidia
  workingOn?: string;
  aiMsg?: string;
  command?: string;
};

export type UnifiedAIResponse = {
  cmd: string;
  msg: string;
  workingon: string;
  success: boolean;
  rawContent: any;
};

export const callAI = async (
  name: AIName,
  params: AIProviderParams,
): Promise<UnifiedAIResponse> => {
  const {
    chatMessages,
    session,
    instructions = defaultInstructions,
    isJson = true,
  } = params;

  if (name === "nvidia") {
    console.log(`[CALL AI - NVIDIA] Initiating request for session: ${session}`);
    const res = await callNvidia(
      params.workingOn || "",
      chatMessages,
      session,
      params.aiMsg || "",
      params.command || "",
      instructions,
      isJson,
    );

    let cmd = res.command || "";
    let msg = res.aiMsg || "";
    let workingon = res.workingOn || "";
    let rawContent: any = msg;

    if (isJson && typeof msg === "string" && msg.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(msg);
        cmd = parsed.cmd || cmd;
        msg = parsed.msg || msg;
        workingon = parsed.workingon || workingon;
        rawContent = parsed;
      } catch (e) {
        // Ignore parsing errors
      }
    }

    console.log(`[CALL AI - NVIDIA] Request completed. Success: ${res.success}`);

    return {
      cmd,
      msg,
      workingon,
      success: res.success ?? false,
      rawContent,
    };
  }

  if (name === "gemini") {
    const res = await geminiAICall(
      chatMessages,
      params.retryCount || 0,
      params.model || "gemini-3.5-flash-lite",
      instructions,
      isJson,
    );

    const actualContent = res.content || {};

    return {
      cmd: actualContent.cmd || "",
      msg: actualContent.msg || "",
      workingon: actualContent.workingon || "",
      success: res.success,
      rawContent: actualContent,
    };
  }

  throw new Error(`AI Provider '${name}' is not supported.`);
};
