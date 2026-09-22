import { callNvidia } from "./Providers/nvidiaAPICall.js";
import {
  geminiAICall,
  GeminiModelsTypes,
  liveGeminiAICall,
} from "./Providers/geminiAI.js";
import {
  tokenRouterAICall,
  TokenRouterModelsTypes,
} from "./Providers/tokenRouterAI.js";
import { instructions as defaultInstructions } from "./instructions/main.Instructions.js";
import type { ChatMessageType, GeminiResponse } from "./Types.ts";

export type AIName = "nvidia" | "gemini" | "tokenrouter" | "local_gemini";
export type GeminiModels = GeminiModelsTypes;
export type LocalGeminiModels =
  | "gemini-3.7-flash"
  | "gemini-3.1-pro"
  | "gemini-3.6-flash"
  | "gemini-3.5-flash-thinking";
export type TokenRouterModels =
  | "qwen/qwen3.8-max-free"
  | "google/gemini-2.0-flash-exp-image-preview"
  | "google/gemini-2.0-flash-exp-video-preview-09-2024"
  | "mistralai/mistral-large-2407"
  | "openai/gpt-oss-20b-instruct-20241022"
  | "google/nano-banana-128b-1218";

export type ModelType = {
  provider: AIName;
  name: GeminiModels | TokenRouterModels | LocalGeminiModels | string;
  isLiveModel?: boolean;
};
export type AIProviderParams = {
  chatMessages: ChatMessageType[];
  session: string;
  instructions?: string;
  isJson?: boolean;
  isLiveModel?: boolean;

  // Specific to Gemini / TokenRouter / Local Gemini
  retryCount?: number;
  model?: GeminiModels | TokenRouterModels | LocalGeminiModels | string;

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
let geminiKeyIndex: number = 0;
export const callAI = async (
  name: AIName,
  params: AIProviderParams,
): Promise<UnifiedAIResponse> => {
  const {
    chatMessages,
    session,
    instructions = defaultInstructions,
    isJson = true,
    isLiveModel = false,
  } = params;

  if (name === "nvidia") {
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

    return {
      cmd,
      msg,
      workingon,
      success: res.success ?? false,
      rawContent,
    };
  }

  if (name === "gemini") {
    const isLive =
      isLiveModel || params.model === "gemini-3.1-flash-live-preview";
    const res = isLive
      ? await liveGeminiAICall({
          chatMessages,
          retryCount: params.retryCount || 0,
          model:
            (params.model as GeminiModelsTypes) ||
            "gemini-3.1-flash-live-preview",
          instructionString: instructions,
          isJson: isJson,
          keyIndex: geminiKeyIndex,
        })
      : await geminiAICall({
          chatMessages,
          retryCount: params.retryCount || 0,
          model: (params.model as GeminiModelsTypes) || "gemini-3.5-flash-lite",
          instructionString: instructions,
          isJson: isJson,
          keyIndex: geminiKeyIndex,
        });
    const actualContent = res.content || {};
    if (res.usedKeyIndex !== undefined) {
      geminiKeyIndex = res.success ? res.usedKeyIndex : res.usedKeyIndex + 1;
    }

    return {
      cmd: actualContent.cmd || "",
      msg: actualContent.msg || "",
      workingon: actualContent.workingon || "",
      success: res.success,
      rawContent: actualContent,
    };
  }

  if (name === "tokenrouter") {
    const res = await tokenRouterAICall({
      chatMessages,
      retryCount: params.retryCount || 0,
      model:
        (params.model as TokenRouterModelsTypes) || "qwen/qwen3.8-max-free",
      instructionString: instructions,
      isJson: true,
    });
    const actualContent = res.content || {};

    return {
      cmd: actualContent.cmd || "",
      msg: actualContent.msg || "",
      workingon: actualContent.workingon || "",
      success: res.success,
      rawContent: actualContent,
    };
  }

  if (name === "local_gemini") {
    try {
      // Dynamic import so it compiles smoothly even when local file is gitignored
      // @ts-ignore
      const { localGeminiAICall } = await import("./Providers/localGeminiCall.js");
      const res = await localGeminiAICall({
        chatMessages,
        model: (params.model as string) || "gemini-3.7-flash",
        instructionString: instructions,
      });
      const actualContent = res.content || {};

      return {
        cmd: actualContent.cmd || "",
        msg: actualContent.msg || "",
        workingon: actualContent.workingon || "",
        success: res.success,
        rawContent: actualContent,
      };
    } catch (err: any) {
      console.error("[LOCAL GEMINI ROUTING ERROR]:", err);
      return {
        cmd: "",
        msg: `Local Gemini Web2API unavailable: ${err.message || err}`,
        workingon: "",
        success: false,
        rawContent: null,
      };
    }
  }

  throw new Error(`AI Provider '${name}' is not supported.`);
};
