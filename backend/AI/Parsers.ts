import { executeCmd } from "../services/execute.service.js";
import { accessMemory } from "../services/memory.service.js";
import { search, search_app } from "../services/search.service.js";
import { broadCastMessage } from "../services/websocket.service.js";
import getSystemInfo from "../tools/getSystemInfo.js";
import { captureScreen } from "../tools/takeScreenShot.js";
import { getHistory, setHistory } from "./LocalChatHistory.js";
import { imageSet } from "./Helper/image.summarizer.js";
import { ChatMessageType, commandParserType } from "./Types.js";

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
  cmd: string,
  session: string,
  chatMessages: ChatMessageType[],
): Promise<commandParserType> => {
  const commandHandlerDict = {
    history: async () => {
      return {
        cmd: cmd,
        msg: "",
        terminalOutput: JSON.stringify(await getHistory(session, 20)),
        terminalError: "",
        isSuccess: true,
      };
    },
    delete_history: async () => {
      await setHistory([], session);
      broadCastMessage({
        type: "ai_done",
        data: { workingon: "" },
      });
      return {
        cmd: cmd,
        msg: "History file Deleted SuccessFully",
        terminalOutput: "",
        terminalError: "",
        isSuccess: true,
      };
    },
    search: async () => {
      const parsedCMD: any = searchParse(cmd);
      try {
        const searchResults: any = await search(
          parsedCMD.path,
          parsedCMD.expected_name,
        );
        return {
          cmd: cmd,
          msg: "",
          terminalOutput: JSON.stringify(
            searchResults.results || searchResults,
          ),
          terminalError: "",
          isSuccess: searchResults.results && searchResults.results.length > 0,
        };
      } catch (e: any) {
        return {
          cmd: cmd,
          msg: "",
          terminalOutput: e.message || String(e),
          terminalError: "",
          isSuccess: false,
        };
      }
    },
    search_app: async () => {
      const results: string = await handle_app_search(cmd);
      return {
        cmd: cmd,
        msg: "",
        terminalOutput: results,
        terminalError: "",
        isSuccess: !!results && results !== "[], [], []",
      };
    },
    system_info: async () => {
      const sysInfo = await getSystemInfo();
      return {
        cmd: cmd,
        msg: "",
        terminalOutput: sysInfo,
        terminalError: "",
        isSuccess: true,
      };
    },
    memory_write: async () => {
      const result: string = await accessMemory(cmd);
      const parsedResult = JSON.parse(result);
      return {
        cmd: cmd,
        msg: "",
        terminalOutput: JSON.stringify(
          parsedResult.document || parsedResult,
          null,
          2,
        ),
        terminalError: "",
        isSuccess: parsedResult.success || true,
      };
    },
    memory_read: async () => {
      const result: string = await accessMemory(cmd);
      const parsedResult = JSON.parse(result);
      return {
        cmd: cmd,
        msg: "",
        terminalOutput: JSON.stringify(
          parsedResult.document || parsedResult,
          null,
          2,
        ),
        terminalError: "",
        isSuccess: parsedResult.success || true,
      };
    },
    memory_delete: async () => {
      const result: string = await accessMemory(cmd);
      const parsedResult = JSON.parse(result);
      return {
        cmd: cmd,
        msg: "",
        terminalOutput: JSON.stringify(
          parsedResult.document || parsedResult,
          null,
          2,
        ),
        terminalError: "",
        isSuccess: parsedResult.success || true,
      };
    },
    capture_screen: async () => {
      const summaryOrFalse = await imageSet(chatMessages);
      return {
        cmd: cmd,
        msg: "",
        terminalOutput: summaryOrFalse || "Image Not Taken",
        terminalError: "",
        isSuccess: !!summaryOrFalse,
      };
    },
  };
  const matchedKey: string = cmd.trim().split("|")[0].trim();
  if (commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]) {
    return await commandHandlerDict[
      matchedKey as keyof typeof commandHandlerDict
    ]();
  } else {
    const result = await executeCmd(cmd);
    return {
      cmd: cmd,
      msg: "",
      terminalOutput: result.stdout,
      terminalError: result.stderr,
      exitCode: result.exitCode,
      isSuccess: result.exitCode === 0,
    };
  }
};
