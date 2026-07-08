import { Logs } from "../Logs.js";
import { WebSocketServer } from "ws";
import { AskAI } from "../AI/askAI.js";
import { broadcast } from "../services/ws.service.js";

export const sendMessage = async (req: any, res: any) => {
  const { message, session } = req.body;
  const wss: WebSocketServer = req.app.get("wss");

  if (!message || !session) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  try {
    await Logs("Processing new chat message request", "info", { message });
    const { cmd, msg, terminalOutput, terminalError } = await AskAI(
      message,
      session,
    );

    // TODO: Step 4. Send live command execution stdout/stderr to WebSocket
    // TODO: Step 5. Feed stdout back to the AI and check if there's a next command

    // Broadcast status to web sockets as a test:
    broadcast(wss, {
      event: "system_status",
      msg: `Received: "${message}". Processing...`,
    });

    await Logs("Successfully processed chat message", "info", {
      lastAIMsg:
        msg === "connect ECONNREFUSED 127.0.0.1:8082"
          ? "Please Start the Proxy Server"
          : msg,
      lastCMD: cmd,
    });

    res.json({
      lastAIMsg: msg || "No message from AI",
      lastCMD: cmd,
      terminal: terminalOutput || (terminalError ? "" : "Success"),
      terminalError: terminalError || "",
    });
  } catch (error: any) {
    await Logs(error, "error", { message });
    res.status(500).json({ error: error.message });
  }
};

export const chatRouteChecker = async (req: any, res: any) => {
  const { message, session } = req.body;
  const wss: WebSocketServer = req.app.get("wss");

  if (!message || !session) {
    res.status(400).json({ error: "Message is required" });
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
    console.log("Data sending: ", resMsg);
    res.status(200).json({
      lastAIMsg: resMsg,
      lastCMD: "",
      terminal: "",
      terminalError: "",
    });
    return;
  } catch (err) {
    res.status(500).json({
      status: "Failed",
      aiMsg: `Error while getting answer: \n${err}`,
    });
    return;
  }
};
