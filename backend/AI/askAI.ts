import { getHistory, setHistory, appendHistory } from "./LocalChatHistory.js";
import { instructions, maxLimit } from "./instructions/main.Instructions.js";
import { broadCastMessage } from "../services/websocket.service.js";
import { commandParser } from "./Parsers.js";
import {
  AIResponse,
  ChatMessageType,
  commandParserType,
} from "./Types.js";
import { callAI } from "./CallAI.js";

export async function AskAI(
  message: string,
  session: string,
  retries: number = 0,
  chatMessages: Array<{ role: string; content: string }> = [],
  accumulatedTerminal: string = "",
  accumulatedError: string = "",
  lastExecutedCmd: string = "",
  capturedImage: string = "",
): Promise<AIResponse> {
  // ==========================================
  // PHASE 1: INITIAL SETUP & RECURSION GUARD
  // ==========================================
  
  // 1. Guard check: Stop if recursion limit is exceeded to prevent infinite loops
  if (retries > maxLimit) {
    return {
      cmd: "",
      msg: "I'm sorry, I can't help you with that. The retries reached the maximum limit!",
      terminalOutput: accumulatedTerminal,
      terminalError: accumulatedError || "Max retries reached",
    };
  }
  // 2. Initial Setup: Load existing chat history only on the initial request (retries === 0)
  if (retries === 0) {
    const userMessage: ChatMessageType = {
      role: "user",
      content: message,
    };

    const prevChatMessages: ChatMessageType[] = await getHistory(session, 10);

    if (prevChatMessages.length > 0) {
      const summaryChat = await getHistory(`summary_${session}`, 1);
      chatMessages = [...summaryChat, ...prevChatMessages, userMessage];
    } else {
      chatMessages = [userMessage];
    }
  }
  

  //Initial variable setup
  let aiMsg: string = "";
  let command: string = "";
  let terminal: string = "";
  let terminalErr: string = "";
  let isSuccessState = true;
  let workingOn: string = "";

  // ==========================================
  // PHASE 2: CALLING THE AI PROVIDER
  // ==========================================

  try {
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: workingOn || "Nexus is Thinking...",
      },
    });
    const aiResponse = await callAI("gemini", {
      chatMessages,
      session,
      instructions,
      isJson: true,
      model: "gemini-3.5-flash-lite",
      workingOn,
      aiMsg,
      command,
    });

    chatMessages.push({
      role: "assistant",
      content: JSON.stringify(aiResponse.rawContent),
    });

    // ==========================================
    // PHASE 3: PARSING & BROADCASTING UI UPDATES
    // ==========================================

    // Removed destructive setHistory to prevent deleting older messages
    command = aiResponse.cmd || "";
    aiMsg = aiResponse.msg || "";
    workingOn = aiResponse.workingon || "";

    if (workingOn || command) {
      if (command) {
        console.log(`[ASK AI] Executing command: ${JSON.stringify(command)}`);
      }

      broadCastMessage({
        type: "ai_data",
        data: {
          workingon:
            workingOn ||
            (command ? `Executing command: ${command}...` : "Processing..."),
        },
      });
    } else {
      broadCastMessage({
        type: "ai_done",
        data: {
          workingon: "",
        },
      });
    }

    // ==========================================
    // PHASE 4: COMMAND EXECUTION
    // ==========================================

    if (command) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const parsedCMD =
        typeof command === "string" ? JSON.parse(command) : command;

      const cmdResults: commandParserType = await commandParser(
        parsedCMD,
        session,
        chatMessages,
      );
      command =
        typeof cmdResults.cmd === "string"
          ? cmdResults.cmd
          : JSON.stringify(cmdResults.cmd || "");
      terminal = cmdResults.terminalOutput || "";
      terminalErr = cmdResults.terminalError || "";
      isSuccessState = cmdResults.isSuccess || false;
      if (cmdResults.imageBase64) {
        capturedImage = cmdResults.imageBase64;
      }
    }
  } catch (error: any) {
    terminalErr = error.message;
    isSuccessState = false;
  }

  // ==========================================
  // PHASE 5: RECURSIVE FEEDBACK LOOP
  // ==========================================

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
      capturedImage
    );
    return response;
  }

  // ==========================================
  // PHASE 6: FINAL RESPONSE & HISTORY SAVING
  // ==========================================

  // 7. Final Response: No more commands to run (base case), return final messages
  if (retries === 0 || !command) {
    const conversationTurn = [
      { role: "user", content: message },
      { role: "assistant", content: JSON.stringify({ cmd: "", msg: aiMsg || "API CALL NO OUTPUT AS A MESSAGE!", workingon: "" }) }
    ];
    await appendHistory(conversationTurn, session); 
  }

  return {
    cmd: command || lastExecutedCmd,
    msg: aiMsg || "API CALL NO OUTPUT AS A MESSAGE!",
    terminalOutput: accumulatedTerminal || terminal,
    terminalError: accumulatedError || terminalErr,
    imageBase64: capturedImage,
  };
}
