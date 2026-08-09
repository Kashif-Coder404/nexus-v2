import { getHistory, setHistory } from "./AiLogs.js";
import { maxLimit } from "./instructions/Instructions.js";
import { broadCastMessage } from "../services/websocket.service.js";
import { geminiAICall } from "./Providers/geminiAI.js";
import { commandParser } from "./Parsers.js";
import { AIResponse, commandParserType } from "./Types.js";

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
    chatMessages = await getHistory(session, 2); // Limit history to last 20 messages to prevent infinite growth
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
  let workingOn: string = "";

  try {
    broadCastMessage({
      type: "ai_data",
      data: { workingon: "Thinking in Gemini..." },
    });
    const geminiResponse: any = await geminiAICall(chatMessages);
    
    chatMessages.push({
      role: "assistant",
      content: JSON.stringify(geminiResponse),
    });
    await setHistory(chatMessages, session);

    command = geminiResponse.content.cmd || "";
    aiMsg = geminiResponse.content.msg || "";
    workingOn = geminiResponse.content.workingon || "";

    broadCastMessage({
      type: workingOn || command ? "ai_data" : "ai_done",
      data: {
        workingon:
          workingOn || (command ? `Executing command ${command}.....` : ""),
      },
    });

    if (command) {
      const cmdResults: commandParserType = await commandParser(
        command,
        session,
      );
      command = cmdResults.cmd || "";
      terminal = cmdResults.terminalOutput || "";
      terminalErr = cmdResults.terminalError || "";
      isSuccessState = cmdResults.isSuccess || false;
      broadCastMessage({
        type: "ai_done",
        data: { workingon: "" },
      });
    }
  } catch (error: any) {
    terminalErr = error.message;
    isSuccessState = false;
  }

  if (command || !isSuccessState) {
    const feedbackContent = {
      message: isSuccessState
        ? "Command ran successfully"
        : "Error on the terminal",
      terminaloutput: terminal,
      terminalerror: terminalErr,
      cmdRunByAi: command,
    };

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
