import { Logs } from "../Logs.js";
import { AskAI } from "../AI/askAI.js";

export const sendMessage = async (req: any, res: any) => {
  const { message, session } = req.body;

  if (!message || !session) {
    res.status(400).json({
      success: false,
      message: "Message and session are required",
      data: null
    });
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
      }
    });
  } catch (error: any) {
    await Logs(error, "error", { message });
    res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred",
      data: null
    });
  }
};

export const chatRouteChecker = async (req: any, res: any) => {
  const { message, session } = req.body;

  if (!message || !session) {
    res.status(400).json({
      success: false,
      message: "Message and session are required",
      data: null
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
    console.log("Data sending: ", resMsg);
    res.status(200).json({
      success: true,
      message: "Message processed successfully",
      data: {
        lastAIMsg: resMsg,
        lastCMD: "",
        terminal: "",
        terminalError: "",
      }
    });
    return;
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || String(err),
      data: null
    });
    return;
  }
};
