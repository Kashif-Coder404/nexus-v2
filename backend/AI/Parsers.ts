import { executeCmd } from "../services/execute.service.js";
import {
  updateMemory,
  getMemory,
  deleteMemory,
} from "../services/memory.service.js";
import { search, search_app } from "../services/search.service.js";
import { broadCastMessage } from "../services/websocket.service.js";
import getSystemInfo from "../tools/getSystemInfo.js";
import { captureScreen } from "../tools/takeScreenShot.js";
import { getHistory, setHistory } from "./LocalChatHistory.js";
import { imageSet } from "./Helper/image.summarizer.js";
import { ChatMessageType, commandParserType } from "./Types.js";
import {
  CommandTypes,
  GlobalSearchType,
  SearchAppParameters,
  MemoryWrite,
  MemoryRead,
  MemoryDelete,
  VolumeType,
} from "./Types/ParserTypes.js";
import { connectDB } from "../db/connectDB.js";
import volume from "../tools/volume.js";

export async function handle_app_search(command: string) {
  function search_app_parse(command: string): {
    isDeapSearch: boolean;
    name: string;
    extension: string;
  } {
    const cmdParsed: any = command.split("|").map((item: any) => item.trim());

    const isDeapSearch: boolean = cmdParsed[1] === "true" ? true : false;
    const name: string = cmdParsed[2];
    const extension: string = cmdParsed[3] === undefined ? "" : cmdParsed[3];
    return { isDeapSearch, name, extension };
  }
  const { isDeapSearch, name, extension } = search_app_parse(command);
  const searchResults: any = await search_app(isDeapSearch, name, extension);
  return JSON.stringify(searchResults, null, 2);
}
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
const searchParse = (
  command: string,
): { path: string; expected_name: string } => {
  const cmdParsed = command.split("|");
  if (cmdParsed.length < 3) return { path: "", expected_name: "" };
  const path = cmdParsed[1].trim();
  const expected_name = cmdParsed[2].trim();
  return { path, expected_name };
};

export const commandParser = async (
  cmd: CommandTypes,
  session: string,
  chatMessages: ChatMessageType[],
): Promise<commandParserType> => {
  const returningCmd: string = JSON.stringify(cmd);
  const commandHandlerDict = {
    history: async () => {
      return {
        cmd: returningCmd,
        msg: "",
        terminalOutput: JSON.stringify(await getHistory(session, 20)),
        terminalError: "",
        isSuccess: true,
      };
    },
    delete_history: async () => {
      const results: boolean = await setHistory([], session);
      return {
        cmd: returningCmd,
        msg: results
          ? "History file Deleted SuccessFully"
          : "Failed to delete History",
        terminalOutput: "",
        terminalError: "",
        isSuccess: results,
      };
    },
    search: async () => {
      const { path, expected_name, extension } = cmd.param as GlobalSearchType;
      const searchResults = await search(path, expected_name, extension);
      return {
        cmd: returningCmd,
        msg: "",
        terminalOutput: JSON.stringify(searchResults.results || searchResults),
        terminalError: "",
        isSuccess: searchResults.results && searchResults.results.length > 0,
      };
    },
    search_app: async () => {
      const { isDeepSearch, name, extention } =
        cmd.param as SearchAppParameters;
      const results: string = JSON.stringify(
        await search_app(isDeepSearch, name, extention),
      );
      return {
        cmd: returningCmd,
        msg: "",
        terminalOutput: results,
        terminalError: "",
        isSuccess: !!results && results !== "[[],[],[]]",
      };
    },
    system_info: async () => {
      const sysInfo = await getSystemInfo();
      return {
        cmd: returningCmd,
        msg: "",
        terminalOutput: sysInfo.info || "",
        terminalError: sysInfo.error || "",
        isSuccess: sysInfo.success,
      };
    },
    memory_write: async () => {
      const { alias, value, category } = cmd.param as MemoryWrite;
      const result: any = await updateMemory(alias, value, category);
      return {
        cmd: returningCmd,
        msg: "",
        terminalOutput: JSON.stringify(result?.document || result, null, 2),
        terminalError: "",
        isSuccess: result?.success || true,
      };
    },
    memory_read: async () => {
      const { alias, category } = cmd.param as MemoryRead;
      const result: any = await getMemory(alias || "", category || "");
      return {
        cmd: returningCmd,
        msg: "",
        terminalOutput: JSON.stringify(result?.document || result, null, 2),
        terminalError: "",
        isSuccess: result?.success || true,
      };
    },
    memory_delete: async () => {
      const { value, alias, category } = cmd.param as MemoryDelete;
      const result: any = await deleteMemory(
        value,
        alias || "",
        category || "",
      );
      return {
        cmd: returningCmd,
        msg: "",
        terminalOutput: JSON.stringify(
          result?.deletedDocument || result,
          null,
          2,
        ),
        terminalError: "",
        isSuccess: result?.success || true,
      };
    },
    capture_screen: async () => {
      const moreContext = (cmd.param as string) || "";
      const summaryOrFalse = await imageSet(chatMessages, moreContext);
      return {
        cmd: returningCmd,
        msg: "",
        terminalOutput: summaryOrFalse ? summaryOrFalse.summary : "Image Not Taken",
        terminalError: "",
        isSuccess: !!summaryOrFalse,
        imageBase64: summaryOrFalse ? summaryOrFalse.base64 : undefined,
      };
    },
    volume: async () => {
      const volParam = cmd.param as VolumeType;
      return await volume(volParam);
    },
  };
  // const matchedKey: string = cmd.trim().split("|")[0].trim();
  const matchedKey: string = cmd.action;
  if (commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]) {
    return await commandHandlerDict[
      matchedKey as keyof typeof commandHandlerDict
    ]();
  } else {
    const args = cmd.param
      ? typeof cmd.param === "string"
        ? " " + cmd.param
        : " " + Object.values(cmd.param).join(" ")
      : "";
    const commandString = cmd.action + args;
    const finalTimeout = cmd.timeout !== undefined ? cmd.timeout : 5000;
    console.log("[COMMAND PARSER] TIMOUT PASSING: ", finalTimeout);
    const result = await executeCmd(commandString, finalTimeout);
    return {
      cmd: returningCmd,
      msg: "",
      terminalOutput: result.stdout,
      terminalError: result.stderr,
      exitCode: result.exitCode,
      isSuccess: result.exitCode === 0,
    };
  }
};
