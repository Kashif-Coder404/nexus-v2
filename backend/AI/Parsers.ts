import { executeCmd, ExecutionResponse } from "../services/execute.service.js";
import {
  updateMemory,
  getMemory,
  deleteMemory,
  accessMemory,
} from "../services/memory.service.js";
import { search, search_app } from "../services/search.service.js";
import { sendCmdRequest } from "../services/websocket.service.js";
import getSystemInfo from "../tools/getSystemInfo.js";
import { imageSet, summarizeBase64Image } from "./Helper/image.summarizer.js";
import { ChatMessageType } from "./Types.js";
import {
  CommandParserResponseType,
  CommandTypes,
  ParametersType,
} from "./Types/ParserTypes.js";

export function extractJSON(text: string): any {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    let jsonStr = text.substring(firstBrace, lastBrace + 1);

    // 1. Strip out bad control characters (raw newlines, tabs) that break JSON.parse inside string literals
    jsonStr = jsonStr.replace(/[\x00-\x1F]+/g, " ");

    // Auto-escape unescaped backslashes (frequent issue with Windows paths from AI)
    jsonStr = jsonStr.replace(/(?<!\\)\\(?![\\"/bfnrtu])/g, "\\\\");

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      // 2. Attempt to auto-fix missing commas between fields (e.g. before "msg":)
      try {
        jsonStr = jsonStr.replace(/"\s*(?="msg"\s*:|"cmd"\s*:)/g, '",');
        return JSON.parse(jsonStr);
      } catch (e2) {
        console.warn(
          "Found JSON-like structure but failed to parse even after auto-fix:",
          e2,
        );
      }
    }
  }

  // 3. Fallback: try to extract 'msg' and 'cmd' using Regex if JSON parsing completely fails.
  let fallbackMsg: string | undefined = undefined;
  let fallbackCmd: string | undefined = undefined;

  const msgMatch = text.match(/"msg"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (msgMatch) {
    try {
      fallbackMsg = JSON.parse('"' + msgMatch[1] + '"');
    } catch {
      fallbackMsg = msgMatch[1];
    }
  }

  const cmdMatch = text.match(/"cmd"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (cmdMatch) {
    try {
      fallbackCmd = JSON.parse('"' + cmdMatch[1] + '"');
    } catch {
      fallbackCmd = cmdMatch[1];
    }
  }

  if (fallbackMsg !== undefined || fallbackCmd !== undefined) {
    console.warn("Salvaged msg/cmd via regex fallback!");
    return { msg: fallbackMsg || "", cmd: fallbackCmd || "" };
  }

  return null;
}
export function parseAIResponse(data: any): string {
  let responseText = "";
  if (typeof data === "string") {
    // Check if the response is a Server-Sent Events (SSE) stream text
    if (data.includes("event:") || data.includes("data:")) {
      const lines = data.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6).trim();
            if (jsonStr) {
              const parsed = JSON.parse(jsonStr);
              if (parsed.delta && typeof parsed.delta.text === "string") {
                responseText += parsed.delta.text;
              } else if (
                parsed.content_block &&
                typeof parsed.content_block.text === "string"
              ) {
                responseText += parsed.content_block.text;
              }
            }
          } catch (e) {
            // Ignore parse errors for partial lines
          }
        }
      }
    } else {
      responseText = data;
    }
  } else if (
    data &&
    data.content &&
    Array.isArray(data.content) &&
    data.content[0]
  ) {
    // Anthropic style format
    responseText = data.content[0].text || "";
  } else if (
    data &&
    data.choices &&
    Array.isArray(data.choices) &&
    data.choices[0]?.message
  ) {
    // OpenAI style format
    responseText = data.choices[0].message.content || "";
  } else if (data && typeof data.response === "string") {
    // Simple wrapper format
    responseText = data.response;
  } else {
    throw new Error(
      `Unexpected API response structure. Keys present: ${Object.keys(data || {}).join(", ")}`,
    );
  }
  return responseText;
}
export const commandParser = async (
  userId: string,
  cmd: CommandTypes,
  chatMessages: ChatMessageType[],
): Promise<CommandParserResponseType> => {
  const returningCmd: string = JSON.stringify(cmd);
  let finalResponse: CommandParserResponseType = {
    cmd: returningCmd,
    msg: "No command Runs!",
    terminalOutput: "",
    terminalError: "",
    isSuccess: false,
    imageBase64: undefined,
    exitCode: undefined,
  };
  const commandHandlerDict = {
    search: async () => {
      const { expected_name } =
        (cmd.param as ParametersType<"search">) || {};
      if (!expected_name) {
        finalResponse.msg = "Missing parameters: expected_name is required";
        finalResponse.terminalError = "Missing parameters";
        finalResponse.isSuccess = false;
        return;
      }
      try {
        const searchResults = await sendCmdRequest(userId, returningCmd);
        finalResponse.cmd = returningCmd;
        finalResponse.msg = searchResults?.msg || "";
        finalResponse.terminalOutput = searchResults?.terminalOutput || "";
        finalResponse.terminalError = searchResults?.terminalError || "";
        finalResponse.isSuccess = Boolean(searchResults?.isSuccess);
      } catch (err: any) {
        finalResponse.cmd = returningCmd;
        finalResponse.msg = "Local backend connection error";
        finalResponse.terminalOutput = "";
        finalResponse.terminalError = `Command execution failed: ${err.message}`;
        finalResponse.isSuccess = false;
      }
    },
    search_app: async () => {
      try {
        const results = await sendCmdRequest(userId, returningCmd);
        finalResponse.cmd = returningCmd;
        finalResponse.msg = results?.msg || "";
        finalResponse.terminalOutput = results?.terminalOutput || "";
        finalResponse.terminalError = results?.terminalError || "";
        finalResponse.isSuccess = Boolean(results?.isSuccess);
      } catch (err: any) {
        finalResponse.cmd = returningCmd;
        finalResponse.msg = "Local backend connection error";
        finalResponse.terminalOutput = "";
        finalResponse.terminalError = `Command execution failed: ${err.message}.`;
        finalResponse.isSuccess = false;
      }
    },
    system_info: async () => {
      try {
        const sysInfo = await sendCmdRequest(userId, returningCmd);
        finalResponse.cmd = returningCmd;
        finalResponse.msg = sysInfo?.msg || "";
        finalResponse.terminalOutput = sysInfo?.terminalOutput || "";
        finalResponse.terminalError = sysInfo?.terminalError || "";
        finalResponse.isSuccess = Boolean(sysInfo?.isSuccess);
      } catch (err: any) {
        finalResponse.cmd = returningCmd;
        finalResponse.msg = "Local backend connection error";
        finalResponse.terminalOutput = "";
        finalResponse.terminalError = `Command execution failed: ${err.message}`;
        finalResponse.isSuccess = false;
      }
    },
    memory_write: async () => {
      const { alias, value, category } =
        cmd.param as ParametersType<"memory_write">;
      const result: any = await updateMemory(userId, alias, value, category);
      const result1: any = await accessMemory(
        userId,
        "memory_read",
        alias || "",
        category || "",
      );
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = JSON.stringify(
        result?.document || result,
        null,
        2,
      );
      finalResponse.terminalError = "";
      finalResponse.isSuccess = result?.success || true;
    },
    memory_read: async () => {
      const { alias, category } = cmd.param as ParametersType<"memory_read">;
      const result: any = await getMemory(userId, alias || "", category || "");
      const result1: any = await accessMemory(
        userId,
        "memory_read",
        alias || "",
        category || "",
      );
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = JSON.stringify(
        result?.document || result,
        null,
        2,
      );
      finalResponse.terminalError = "";
      finalResponse.isSuccess = result?.success || true;
    },
    memory_delete: async () => {
      const { value, alias, category } =
        cmd.param as ParametersType<"memory_delete">;
      const result: any = await deleteMemory(
        userId,
        value,
        alias || "",
        category || "",
      );
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = JSON.stringify(
        result?.deletedDocument || result,
        null,
        2,
      );
      finalResponse.terminalError = "";
      finalResponse.isSuccess = result?.success || true;
    },
    capture_screen: async () => {
      try {
        const moreContext = (cmd.param as string) || "";
        const localResponse = await sendCmdRequest(userId, returningCmd);
        if (!localResponse?.isSuccess || !localResponse?.imageBase64) {
          finalResponse.cmd = returningCmd;
          finalResponse.msg = localResponse?.msg || "Image Not Captured";
          finalResponse.terminalOutput = "Image Not Captured";
          finalResponse.terminalError =
            localResponse?.terminalError ||
            "Could not capture screenshot from local machine.";
          finalResponse.isSuccess = false;
          return;
        }

        const summarized = await summarizeBase64Image(
          localResponse.imageBase64,
          chatMessages,
          moreContext,
        );

        finalResponse.cmd = returningCmd;
        finalResponse.msg = "";
        finalResponse.terminalOutput = summarized
          ? summarized.summary
          : "Image Captured but Summarization Failed";
        finalResponse.terminalError = "";
        finalResponse.isSuccess = !!summarized;
        finalResponse.imageBase64 = summarized
          ? summarized.base64
          : localResponse.imageBase64;
      } catch (err: any) {
        finalResponse.cmd = returningCmd;
        finalResponse.msg = "Local backend connection error";
        finalResponse.terminalOutput = "";
        finalResponse.terminalError = `Command execution failed: ${err.message}.`;
        finalResponse.isSuccess = false;
      }
    },
    in_built: async () => {
      const timeoutMs =
        cmd.timeout && !isNaN(Number(cmd.timeout))
          ? Number(cmd.timeout)
          : 30000;
      try {
        const executionResponse = await sendCmdRequest(
          userId,
          returningCmd,
          timeoutMs,
        );
        finalResponse.cmd = returningCmd;
        finalResponse.msg = executionResponse?.msg || "";
        finalResponse.terminalOutput = executionResponse?.terminalOutput || "";
        finalResponse.terminalError = executionResponse?.terminalError || "";
        finalResponse.exitCode = executionResponse?.exitCode;
        finalResponse.isSuccess = Boolean(executionResponse?.isSuccess);
      } catch (err: any) {
        finalResponse.cmd = returningCmd;
        finalResponse.msg = "Local backend connection error";
        finalResponse.terminalOutput = "";
        finalResponse.terminalError = `Command execution failed: ${err.message}.`;
        finalResponse.isSuccess = false;
      }
    },
  };

  const matchedKey: string = cmd.action;
  if (commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]) {
    await commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]();
  }
  return finalResponse;
};
