import { executeCmd, ExecutionResponse } from "../services/execute.service.js";
import {
  updateMemory,
  getMemory,
  deleteMemory,
} from "../services/memory.service.js";
import { search, search_app } from "../services/search.service.js";
import getSystemInfo from "../tools/getSystemInfo.js";
import { getHistory, setHistory } from "./LocalChatHistory.js";
import { imageSet } from "./Helper/image.summarizer.js";
import { ChatMessageType } from "./Types.js";
import {
  ActionTypes,
  BaseCommandType,
  CommandParserResponseType,
  CommandTypes,
  MatchKeyType,
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
  cmd: CommandTypes,
  session: string,
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
    history: async () => {
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = JSON.stringify(
        await getHistory(session, 20),
      );
      finalResponse.terminalError = "";
      finalResponse.isSuccess = true;
    },
    delete_history: async () => {
      const results: boolean = await setHistory([], session);
      finalResponse.cmd = returningCmd;
      finalResponse.msg = results
        ? "History file Deleted SuccessFully"
        : "Failed to delete History";
      finalResponse.terminalOutput = "";
      finalResponse.terminalError = "";
      finalResponse.isSuccess = results;
    },
    search: async () => {
      const { path, expected_name, extension } =
        cmd.param as ParametersType<"search">;
      if (!path || !expected_name || !extension) {
        finalResponse.msg = "Missing parameters";
        finalResponse.terminalError = "Missing parameters";
        finalResponse.isSuccess = false;
        return;
      }
      const searchResults = await search(path, expected_name, extension);
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = JSON.stringify(
        searchResults.results || searchResults,
      );
      finalResponse.terminalError = "";
      finalResponse.isSuccess =
        searchResults.results && searchResults.results.length > 0;
    },
    search_app: async () => {
      const { isDeepSearch, name, extention } =
        cmd.param as ParametersType<"search_app">;
      const results: string = JSON.stringify(
        await search_app(isDeepSearch, name, extention),
      );
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = results;
      finalResponse.terminalError = "";
      finalResponse.isSuccess = !!results && results !== "[[],[],[]]";
    },
    system_info: async () => {
      const sysInfo = await getSystemInfo();
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = sysInfo.info || "";
      finalResponse.terminalError = sysInfo.error || "";
      finalResponse.isSuccess = sysInfo.success;
    },
    memory_write: async () => {
      const { alias, value, category } =
        cmd.param as ParametersType<"memory_write">;
      const result: any = await updateMemory(alias, value, category);

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
      const result: any = await getMemory(alias || "", category || "");
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
      const moreContext = (cmd.param as string) || "";
      const summaryOrFalse = await imageSet(chatMessages, moreContext);
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = summaryOrFalse
        ? summaryOrFalse.summary
        : "Image Not Taken";
      finalResponse.terminalError = "";
      finalResponse.isSuccess = !!summaryOrFalse;
      finalResponse.imageBase64 = summaryOrFalse
        ? summaryOrFalse.base64
        : undefined;
    },
    in_built: async () => {
      const executionResponse: ExecutionResponse = await executeCmd(
        cmd.param as string,
        cmd.timeout || 5000,
      );
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = executionResponse.stdout;
      finalResponse.terminalError = executionResponse.stderr;
      finalResponse.exitCode = executionResponse.exitCode;
      finalResponse.isSuccess = executionResponse.exitCode === 0;
    },
  };
  // const matchedKey: string = cmd.trim().split("|")[0].trim();
  const matchedKey: string = cmd.action;
  let allCommandKeys: string[] = [];
  for (let keys in commandHandlerDict) allCommandKeys.push(keys);
  console.log("[COMMAND PARSER] All Command Keys => ", allCommandKeys);
  if (commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]) {
    await commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]();
  }
  return finalResponse;
};
