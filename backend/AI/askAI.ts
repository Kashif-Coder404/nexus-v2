import { apiCall } from "./AICall.js";
import { getHistory, setHistory } from "./AiLogs.js";
import { executeCmd } from "../services/execute.service.js";

interface AIResponse {
  cmd: string;
  msg: string;
  terminalOutput: string;
  terminalError: string;
}
const maxLimit: number = 6;
export function extractJSON(text: string): any {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonStr = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Found JSON-like structure but failed to parse:", e);
    }
  }
  return null;
}

export async function AskAI(
  message: string,
  session: string,
  retries: number = 0,
  chatMessages: Array<{ role: string; content: string }> = [],
  accumulatedTerminal: string = "",
  accumulatedError: string = "",
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
    chatMessages.push({ role: "user", content: message });
  }

  let aiMsg: string = "";
  let command: string = "";
  let terminal: string = "";
  let terminalErr: string = "";
  let isSuccessState = true;

  try {
    // 3. Query the AI proxy for the next action/command
    const data = await apiCall(chatMessages);
    chatMessages.push({ role: "assistant", content: data });

    await setHistory(chatMessages, session);

    // 4. Parse the AI response to extract command instructions
    const parsed = extractJSON(data);
    aiMsg = parsed ? parsed.msg || "" : data;
    command = parsed ? parsed.cmd || "" : "";

    // 5. Execute the command if requested by the AI
    if (command) {
      let exitCode = 0;
      if (command === "history") {
        const chatHistory = await getHistory(session, 20);
        terminal = JSON.stringify(chatHistory, null, 2);
      } else {
        const result = await executeCmd(command);
        terminal = result.stdout;
        terminalErr = result.stderr;
        exitCode = result.exitCode;
      }
      isSuccessState = exitCode === 0;
    }
  } catch (error: any) {
    console.error("[ASK AI ERROR]", error.message);
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

    console.log("Next Turn / Retry: ", retries + 1);

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
    );
    return response;
  }

  // 7. Final Response: No more commands to run (base case), return final messages
  return {
    cmd: command,
    msg: aiMsg,
    terminalOutput: accumulatedTerminal || terminal,
    terminalError: accumulatedError || terminalErr,
  };
}
