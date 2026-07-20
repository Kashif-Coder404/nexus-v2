import { apiCall } from "./AICall.js";
import { getHistory, setHistory } from "./AiLogs.js";
import { executeCmd } from "../services/execute.service.js";

interface AIResponse {
  cmd: string;
  msg: string;
  terminalOutput: string;
  terminalError: string;
}
import { maxLimit } from "./instructions/Instructions.js";
import { broadCastMessage } from "../services/websocket.service.js";
import {
  search,
  search_app,
  SearchOutput,
} from "../services/search.service.js";
import getSystemInfo from "../tools/getSystemInfo.js";
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

const searchParse = (
  command: string,
): { path: string; expected_name: string } => {
  const cmdParsed = command.split("|");
  if (cmdParsed.length < 3) return { path: "", expected_name: "" };
  const path = cmdParsed[1].trim();
  const expected_name = cmdParsed[2].trim();
  return { path, expected_name };
};
export async function AskAI(
  message: string,
  session: string,
  retries: number = 0,
  chatMessages: Array<{ role: string; content: string }> = [],
  accumulatedTerminal: string = "",
  accumulatedError: string = "",
  lastExecutedCmd: string = "",
): Promise<AIResponse> {
  // 1. Guard check: Stop if recursion limit is exceeded to prevent infinite loops
  if (retries > maxLimit) {
    return {
      cmd: "",
      msg: "I'm sorry, I can't help you with that. The retries reached the maximum limit!",
      terminalOutput: accumulatedTerminal,
      terminalError: accumulatedError || "Max retries reached",
    };
  }

  // 2. Initial Setup: Load existing chat history and append the user's new message
  if (retries === 0) {
    chatMessages = await getHistory(session, 20); // Limit history to last 20 messages to prevent infinite growth
    chatMessages.push({
      role: "user",
      content: JSON.stringify({ msg: message, session_token: session }),
    });
  }

  let aiMsg: string = "";
  let command: string = "";
  let terminal: string = "";
  let terminalErr: string = "";
  let isSuccessState = true;

  try {
    // 3. Query the AI proxy for the next action/command
    const data: any = await apiCall(chatMessages);
    chatMessages.push({ role: "assistant", content: data });
    await setHistory(chatMessages, session);
    // 4. Parse the AI response to extract command instructions
    const parsed = extractJSON(data);

    if (parsed) {
      aiMsg = parsed.msg || "";
      command = parsed.cmd || "";
    } else {
      if (
        typeof data === "string" &&
        (data.includes('{"cmd"') || data.includes('{"msg"'))
      ) {
        aiMsg =
          "I encountered an error generating my response due to a malformed output.";
      } else {
        aiMsg = data;
      }
      command = "";
    }
    broadCastMessage({
      type: parsed?.workingon ? "ai_data" : "ai_done",
      data: { workingon: parsed?.workingon || "" },
    });

    // 5. Execute the command if requested by the AI

    if (command) {
      let exitCode = 0;
      if (command === "history") {
        const chatHistory = await getHistory(session, 20);
        terminal = JSON.stringify(chatHistory, null, 2);
      } else if (
        typeof command === "string" &&
        command.includes("Delete History")
      ) {
        await setHistory([], session);
        broadCastMessage({
          type: "ai_done",
          data: { workingon: "" },
        });
        return {
          cmd: "",
          msg: "History file Deleted SuccessFully",
          terminalOutput: "",
          terminalError: "",
        };
      } else if (
        typeof command === "string" &&
        command.startsWith("search |")
      ) {
        const parsedCMD: any = searchParse(command);
        try {
          const searchResults: any = await search(
            parsedCMD.path,
            parsedCMD.expected_name,
          );
          console.log("Search Results: ", searchResults);
          terminal = JSON.stringify(
            searchResults.results || searchResults,
            null,
            2,
          );
          isSuccessState =
            searchResults.results && searchResults.results.length > 0;
        } catch (e: any) {
          terminal = e.message || String(e);
          isSuccessState = false;
        }
      } else if (
        typeof command === "string" &&
        command.startsWith("search_app |")
      ) {
        const results: any = await handle_app_search(command);
        terminal = results;
        terminalErr = "";
        isSuccessState = !!results && results !== "[]";
      } else if (
        typeof command === "string" &&
        command.includes("system_info")
      ) {
        const sysInfo = await getSystemInfo();
        terminal = sysInfo;
        terminalErr = "";
        isSuccessState = true;
      } else {
        const result = await executeCmd(command);
        terminal = result.stdout;
        terminalErr = result.stderr;
        exitCode = result.exitCode;
        isSuccessState = exitCode === 0;
      }
    }
  } catch (error: any) {
    console.error("[ASK AI ERROR]", error.message, error);
    terminalErr = error.message;
    isSuccessState = false;
  }

  // 6. Feedback & Recursion: If a command was run or an error occurred, feed the result back to the AI
  if (command || !isSuccessState) {
    const feedbackContent = {
      message: isSuccessState
        ? "Command ran successfully"
        : "Error on the terminal",
      terminaloutput: terminal,
      terminalerror: terminalErr,
      cmdRunByAi: command,
    };

    // Append the feedback to the messages context list for the AI's next turn
    chatMessages.push({
      role: "user",
      content: JSON.stringify(feedbackContent, null, 2),
    });

    const nextAccumulated = accumulatedTerminal
      ? `${accumulatedTerminal}\n${terminal}`
      : terminal;
    const nextAccumulatedErr = accumulatedError
      ? `${accumulatedError}\n${terminalErr}`
      : terminalErr;

    // Recurse to let the AI process the command output and decide the next action
    const response = await AskAI(
      message,
      session,
      retries + 1,
      chatMessages,
      nextAccumulated,
      nextAccumulatedErr,
      command || lastExecutedCmd,
    );
    return response;
  }

  // 7. Final Response: No more commands to run (base case), return final messages
  return {
    cmd: command || lastExecutedCmd,
    msg: aiMsg || "API CALL NO OUTPUT AS A MESSAGE!",
    terminalOutput: accumulatedTerminal || terminal,
    terminalError: accumulatedError || terminalErr,
  };
}
