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
import {
  instructions,
  system_warning,
} from "./instructions/main.Instructions.js";
import { getChat, setChat } from "../services/chat.history.service.js";
import { buildAiContext } from "./Helper/context.summarize.js";
import { SessionModel } from "../db/schema/session-schema.js";

export type CommandExecutionType = {
  steps: number;
  cmd: {
    action?: string;
    param?: any;
  };
  msg: string;
  terminalOutput: string;
  terminalError: string;
  isSuccess: boolean;
  exitCode?: string;
  duration?: string;
  cwd?: string;
};
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
  let lastStepError = "";
  let capturedImage = "";
  let success = false;
  let isSuccessState = false;
  let workingOn = "";
  let executions: CommandExecutionType[] = [];
  let lastRawCmd: string = "";
  let duplicateCMDCount: number = 0;
  let commandRunningMsgs: ChatMessageType[] = [];

  const overallStart = Date.now();
  const rawPrevChat: ChatMessageType[] =
    (await getChat(userId, session, 10))?.chat || [];
  const prevChat = buildAiContext(rawPrevChat);
  let summaryChat: ChatMessageType[] = [];
  const summarySessionDoc: any = await SessionModel.findOne({
    userId,
    title: `summary_chat_${session}`,
  });
  if (summarySessionDoc) {
    summaryChat =
      (await getChat(userId, summarySessionDoc._id.toString(), 1))?.chat || [];
  }
  let chatHistory: ChatMessageType[] = [
    ...summaryChat,
    ...prevChat,
    {
      role: "user",
      content: userMessage,
    },
  ];

  //Execution loops
  while (retries <= 15) {
    const ChatMsgs: ChatMessageType[] = [...chatHistory, ...commandRunningMsgs];
    //Broadcasting here...
    sendToUser(userId, {
      type: "ai_data",
      data: {
        workingon: "Nexus is thinking...",
        msg: "",
        cmd: command || lastExecutedCmd || "",
        executions,
      },
    });
    try {
      aiResponse = await callAI(model.provider, {
        userId: userId,
        chatMessages: ChatMsgs,
        session: session,
        instructions: instructions,
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
          executions,
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
        if (lastRawCmd === command) {
          duplicateCMDCount++;
        } else {
          duplicateCMDCount = 0;
        }
        if (duplicateCMDCount >= 3) {
          break;
        }
        lastRawCmd = command;
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
        const stepStart = Date.now();
        const commandOutput: CommandParserResponseType = await commandParser(
          userId,
          parsedCMD,
          ChatMsgs,
        );
        const stepDuration = ((Date.now() - stepStart) / 1000).toFixed(1) + "s";
        const currentCwd =
          (typeof parsedCMD.param === "object" &&
            (parsedCMD.param as any)?.cwd) ||
          process.cwd();
        capturedImage = commandOutput.imageBase64 || "";
        terminalOutput += commandOutput.terminalOutput
          ? commandOutput.terminalOutput + "\n"
          : "";
        executions.push({
          steps: executions.length + 1,
          cmd: {
            action: parsedCMD.action,
            param: parsedCMD.param,
          },
          msg: commandOutput.msg || aiResponse?.msg || "",
          terminalError: commandOutput.terminalError || "",
          terminalOutput: commandOutput.terminalOutput || "",
          isSuccess: commandOutput.isSuccess,
          exitCode: commandOutput.exitCode?.toString() || "",
          duration: stepDuration,
          cwd: currentCwd,
        });
        sendToUser(userId, {
          type: "ai_data",
          data: {
            workingon: "Completed " + actionDesc,
            msg: "",
            cmd: command,
            executions, // <-- Send the updated steps list!
          },
        });

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
        lastStepError = currentError;
        command = commandOutput.cmd || commandOutput.msg || "";
        isSuccessState = commandOutput.isSuccess;
        success = commandOutput.isSuccess;
        let aiTerminalError = currentError;
        if (duplicateCMDCount >= 1) {
          aiTerminalError =
            system_warning(
              lastExecutedCmd || "",
              duplicateCMDCount,
              terminalError || "",
            ) + "\n\n";
        }
        const feedbackContent: any = {
          status: isSuccessState ? "success" : "failed",
          command_executed: command || "",
          summary: commandOutput.msg || "",
          terminal_output: terminalOutput || "No output",
          terminal_error: aiTerminalError || "",
        };
        sendToUser(userId, {
          type: "ai_data",
          data: {
            workingon: "✍️ Finalizing response...",
            msg: "",
            cmd: "",
          },
        });
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
  const totalWorkedSeconds = Math.max(
    1,
    Math.round((Date.now() - overallStart) / 1000),
  );
  const finalMsg =
    aiResponse?.msg ||
    (retries >= 15
      ? "Maximum try reached!"
      : "AI service encountered an issue. Please try again.");

  const finalTurnSave: ChatMessageType[] = [
    { role: "user", content: userMessage },
    {
      role: "assistant",
      content: finalMsg,
      executions: executions || [],
      imageBase64: capturedImage,
      workedSeconds: totalWorkedSeconds,
    },
  ];
  await setChat(userId, session, finalTurnSave);

  return {
    cmd: lastExecutedCmd || "",
    msg: finalMsg,
    terminalOutput: terminalOutput || "",
    terminalError: isSuccessState ? "" : lastStepError || terminalError || "",
    imageBase64: capturedImage || "",
    executions: executions || [],
    workedSeconds: totalWorkedSeconds,
  };
};
function cmd_explainer(action: string, param: any) {
  if (action === "search") {
    return `🔍 Searching files for "${param?.expected_name || ""}"...`;
  } else if (action === "search_app") {
    return `🚀 Searching for app "${param?.name || ""}"...`;
  } else if (action === "in_built") {
    const cmdText =
      typeof param === "object" && param !== null
        ? param.command || JSON.stringify(param)
        : param || "";
    return `⚡ Running: ${cmdText}...`;
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
