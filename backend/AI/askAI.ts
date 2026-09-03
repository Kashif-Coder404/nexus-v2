import { commandParser } from "./Parsers.js";
import { ChatMessageType } from "./Types.js";
import {
  CommandParserResponseType,
  commandParserType,
  CommandTypes,
} from "./Types/ParserTypes.js";

import { callAI, ModelType } from "./CallAI.js";
import { sendToUser } from "../services/websocket.service.js";
import { behaviourPrompt } from "./instructions/behaviour.instructions.js";
import { instructions } from "./instructions/main.Instructions.js";
import { getChat, setChat } from "../services/chat.history.service.js";
export const askAI = async (
  userId: string,
  session: string,
  userMessage: string,
  behaviour: string,
  model: ModelType,
) => {
  let retries = 0;
  let aiResponse: any = null;
  let command: string = "";
  let lastExecutedCmd: string = "";
  let terminalOutput = "";
  let terminalError = "";
  let capturedImage = "";
  let success = false;
  let isSuccessState = false;
  let workingOn = "";

  const prevChat: ChatMessageType[] =
    (await getChat(userId, session, 10))?.chat || [];
  const summaryChat: ChatMessageType[] =
    (await getChat(userId, `summary_${session}`, 1))?.chat || [];
  let chatHistory: ChatMessageType[] = [
    ...summaryChat,
    ...prevChat,
    {
      role: "user",
      content: userMessage,
    },
  ];
  let commandRunningMsgs: ChatMessageType[] = [];

  while (retries <= 15) {
    const ChatMsgs: ChatMessageType[] = [...chatHistory, ...commandRunningMsgs];
    //Broadcasting here...
    sendToUser(userId, {
      type: "ai_data",
      data: {
        workingon: "Nexus is thinking...",
        msg: "",
        cmd: command || lastExecutedCmd || "",
      },
    });
    try {
      let currentMainInstructions: string =
        behaviourPrompt(behaviour) + "\n" + instructions;
      aiResponse = await callAI(model.provider, {
        chatMessages: ChatMsgs,
        session: session,
        instructions: currentMainInstructions,
        isJson: true,
        isLiveModel: model.isLiveModel,
        retryCount: 0,
        model: model.name,
      });

      commandRunningMsgs.push({
        role: "assistant",
        content: JSON.stringify(aiResponse.rawContent),
      });

      workingOn =
        aiResponse.workingon || (aiResponse as any).workingOn || "Thinking...";
      sendToUser(userId, {
        type: "ai_data",
        data: {
          workingon: workingOn,
          msg: aiResponse.msg || "",
          cmd: command || lastExecutedCmd || "",
        },
      });
      const actualContent = aiResponse;
      if (!actualContent || actualContent.success === false) {
        break;
      }
      if (
        actualContent.cmd == null ||
        String(actualContent.cmd).trim() === "" ||
        (typeof actualContent.cmd === "object" && !actualContent.cmd.action)
      ) {
        break;
      }
      if (typeof actualContent.cmd === "object" && actualContent.cmd.action) {
        command = JSON.stringify(actualContent.cmd);
      } else if (typeof actualContent.cmd === "string") {
        command = actualContent.cmd;
      } else {
        command = "";
      }
      if (command) {
        lastExecutedCmd = command;
        const parsedCMD: CommandTypes = JSON.parse(command);
        let actionDesc: string = cmd_explainer(
          parsedCMD.action,
          parsedCMD.param,
        );
        sendToUser(userId, {
          type: "ai_data",
          data: {
            workingon: actionDesc,
            msg: aiResponse?.msg || "",
            cmd: command,
          },
        });
        const commandOutput: CommandParserResponseType = await commandParser(
          userId,
          parsedCMD,
          ChatMsgs,
        );
        capturedImage = commandOutput.imageBase64 || "";
        terminalOutput += commandOutput.terminalOutput
          ? commandOutput.terminalOutput + "\n"
          : "";

        let currentError = commandOutput.terminalError || "";

        if (
          commandOutput.exitCode !== undefined &&
          commandOutput.exitCode !== null
        ) {
          currentError += currentError
            ? commandOutput.exitCode
              ? `\nEXIT CODE: ${commandOutput.exitCode}`
              : ""
            : commandOutput.exitCode
              ? `EXIT CODE: ${commandOutput.exitCode}`
              : "";
        }
        terminalError += currentError ? currentError + "\n" : "";
        command = commandOutput.cmd || commandOutput.msg || "";
        isSuccessState = commandOutput.isSuccess;
        success = commandOutput.isSuccess;
        const feedbackContent: any = {
          status: isSuccessState ? "success" : "failed",
          command_executed: command || "",
          terminal_output: terminalOutput || "No output",
          terminal_error: terminalError || "",
        };
        commandRunningMsgs.push({
          role: "user",
          content: JSON.stringify(feedbackContent, null, 2),
        });
      }
    } catch (error: any) {
      terminalError += `\nRuntime Error: ${error.message}`;
      isSuccessState = false;
      commandRunningMsgs.push({
        role: "user",
        content: JSON.stringify(
          {
            status: "failed",
            command_executed: command || "",
            terminal_output: terminalOutput || "No output",
            terminal_error: terminalError || "",
          },
          null,
          2,
        ),
      });
    }
    retries++;
  }

  const finalTurnSave: ChatMessageType[] = [
    { role: "user", content: userMessage },
    {
      role: "assistant",
      content: JSON.stringify({
        cmd: lastExecutedCmd || "",
        msg: aiResponse?.msg || "API CALL NO OUTPUT AS A MESSAGE!",
        terminalError: terminalError || "",
        terminalOutput: terminalOutput || "",
      }),
    },
  ];
  await setChat(userId, session, finalTurnSave);
  const finalMsg =
    aiResponse?.msg ||
    (retries >= 15
      ? "Maximum try reached!"
      : "AI service encountered an issue. Please try again.");

  return {
    cmd: lastExecutedCmd || "",
    msg: finalMsg,
    terminalOutput: terminalOutput || "",
    terminalError: terminalError || "",
    imageBase64: capturedImage || "",
  };
};
function cmd_explainer(action: string, param: any) {
  if (action === "search") {
    return `🔍 Searching files for "${param?.expected_name || ""}"...`;
  } else if (action === "search_app") {
    return `🚀 Searching for app "${param?.name || ""}"...`;
  } else if (action === "in_built") {
    return `⚡ Running: ${param}...`;
  } else if (action === "capture_screen") {
    return "📸 Capturing desktop screenshot...";
  } else if (action === "system_info") {
    return "📊 Fetching system diagnostics...";
  } else if (action === "memory_read") {
    return `🧠 Checking memory for "${param?.alias || ""}"...`;
  } else {
    return "💻 Executing command...";
  }
}
