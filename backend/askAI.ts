import { apiCall } from "./AICall.js";
import { executeCmd } from "./execute.js";

interface AIResponse {
  cmd: string;
  msg: string;
  terminalOutput: string;
}
const maxLimit: number = 6;
function extractJSON(text: string): any {
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
  retries: number = 0,
  chatMessages: Array<{ role: string; content: string }> = [],
): Promise<AIResponse> {
  if (retries > maxLimit) {
    return {
      cmd: "",
      msg: "I'm sorry, I can't help you with that. The retries reached the maximum limit!",
      terminalOutput: "Max retries reached",
    };
  }

  // Initialize history on first call
  if (chatMessages.length === 0) {
    chatMessages.push({ role: "user", content: message });
  }

  let aiMsg: string = "";
  let command: string = "";
  let terminal: string = "";

  try {
    const data = await apiCall(message, chatMessages);
    console.log("Data from AI proxy: ", data);

    // Save the assistant response to the conversation history
    chatMessages.push({ role: "assistant", content: data });
    console.log("Chat messages: ", chatMessages);
    const parsed = extractJSON(data);
    if (parsed) {
      command = parsed.cmd || "";
      aiMsg = parsed.msg || "";
    } else {
      aiMsg = data;
      command = "";
    }

    if (command) {
      const { stdout, stderr, exitCode } = await executeCmd(command);
      terminal = stdout ? stdout : stderr;
      console.log("Terminal: ", terminal);

      // Create feedback object
      const feedbackContent = {
        message:
          exitCode === 0 ? "Command ran successfully" : "Error on the terminal",
        terminaloutput: terminal,
        cmdRunByAi: command,
      };

      // Append feedback to the history (must be stringified JSON string for LLM APIs)
      chatMessages.push({
        role: "user",
        content: JSON.stringify(feedbackContent, null, 2),
      });
      console.log("ChatMessages: ", chatMessages);
      console.log("Next Turn / Retry: ", retries + 1);
      const response = await AskAI(message, retries + 1, chatMessages);
      return response;
    }
  } catch (error: any) {
    console.log("[ASK AI ERROR]", error.message);
    terminal = error.message;

    // Create error feedback object
    const errorFeedback = {
      message: "Error on the terminal",
      terminaloutput: error.message,
      cmdRunByAi: command,
    };

    // Append error feedback to the history (must be stringified JSON string for LLM APIs)
    chatMessages.push({
      role: "user",
      content: JSON.stringify(errorFeedback, null, 2),
    });

    retries++;
    console.log("Retry: ", retries);
    const response = await AskAI(message, retries, chatMessages);
    return response;
  }
  return {
    cmd: command,
    msg: aiMsg,
    terminalOutput: terminal,
  };
}
