import { Logs } from "../Logs.js";
import { AskAI } from "../AI/askAI.js";
import { broadCastMessage } from "../services/websocket.service.js";
import { getHistory, setHistory } from "../AI/LocalChatHistory.js";
import { ChatMessageType } from "../AI/Types.js";
import { summarize } from "../AI/summarizer.js";

export const sendMessage = async (req: any, res: any) => {
  const { message, session } = req.body;

  if (!message || !session) {
    res.status(400).json({
      success: false,
      message: "Message and session are required",
      data: null,
    });
    return;
  }
  broadCastMessage({
    type: "acknowledged",
    status: "received",
    message: message,
  });

  try {
    await Logs("Processing new chat message request", "info", { message });
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: "Analyzing your request...",
      },
    });
    const { cmd, msg, terminalOutput, terminalError } = await AskAI(
      message,
      session,
    );
    broadCastMessage({
      type: "ai_done",
      data: {
        workingon: "",
      },
    });

    await Logs("Successfully processed chat message", "info", {
      lastAIMsg:
        msg === "connect ECONNREFUSED 127.0.0.1:8082"
          ? "Please Start the Proxy Server"
          : msg,
      lastCMD: cmd,
    });

    res.json({
      success: true,
      message: "Chat message processed successfully",
      data: {
        lastAIMsg: msg || "No message from AI",
        lastCMD: cmd,
        terminal: terminalOutput || (terminalError ? "" : "Success"),
        terminalError: terminalError || "",
      },
    });

    async function summarizeBackground() {
      const prevChatMessages: ChatMessageType[] = await getHistory(session, 10);
      const summaryResult = await summarize(prevChatMessages, session);
      if (summaryResult.length > 0) {
        await setHistory(summaryResult, `summary_${session}`);
      }
    }
    summarizeBackground().catch(err => console.error("[BACKGROUND SUMMARY ERROR]: ", err));
  } catch (error: any) {
    broadCastMessage({
      type: "ai_done",
      data: {
        workingon: "",
      },
    });
    await Logs(error, "error", { message });
    res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred",
      data: null,
    });
  }
};

export const chatRouteChecker = async (req: any, res: any) => {
  const { message, session } = req.body;

  if (!message || !session) {
    res.status(400).json({
      success: false,
      message: "Message and session are required",
      data: null,
    });
    return;
  }

  //Temporary Returning message;

  try {
    let resMsg = "Hello!";
    let incomingMsg = message.trim().toLowerCase();
    if (incomingMsg === "hello" || incomingMsg === "hi") {
      resMsg = "Hello! How can I help you today !";
    } else if (incomingMsg.includes("open")) {
      if (incomingMsg.includes("vscode")) {
        resMsg = "Opening the vscode for you!";
      }
    }
    res.status(200).json({
      success: true,
      message: "Message processed successfully",
      data: {
        lastAIMsg: resMsg,
        lastCMD: "",
        terminal: "",
        terminalError: "",
      },
    });
    return;
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || String(err),
      data: null,
    });
    return;
  }
};
