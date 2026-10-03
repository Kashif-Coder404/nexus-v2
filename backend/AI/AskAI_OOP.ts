import { SessionModel } from "../db/schema/session-schema.js";
import { getChat, setChat } from "../services/chat.history.service.js";
import { activeSessions, sendToUser } from "../services/websocket.service.js";
import { callAI, ModelType } from "./CallAI.js";
import { buildAiContext } from "./Helper/context.summarize.js";
import {
  instructions,
  system_warning,
} from "./instructions/main.Instructions.js";
import { commandParser } from "./Parsers.js";
import { ChatMessageType } from "./Types.js";
import { CommandExecutionType } from "./Types/AIResponseTypes.js";
import {
  CommandParserResponseType,
  CommandTypes,
} from "./Types/ParserTypes.js";

export class AskAI {
  private userId: string;
  private sessionId: string;
  private userMessage: string;
  private model: ModelType;

  private retries = 0;
  private aiResponse: any = null;
  private command: string = "";
  private lastExecutedCmd: string = "";
  private terminalOutput = "";
  private terminalError = "";
  private lastStepError = "";
  private capturedImage = "";
  private success = false;
  private isSuccessState = false;
  private workingOn = "";
  private executions: CommandExecutionType[] = [];
  private lastRawCmd: string = "";
  private duplicateCMDCount: number = 0;
  private commandRunningMsgs: ChatMessageType[] = [];

  private overstart: number = Date.now();
  private prvChat: ChatMessageType[] = [];
  constructor(
    userId: string,
    session: string,
    userMessage: string,
    model: ModelType,
  ) {
    this.userId = userId;
    this.sessionId = session;
    this.userMessage = userMessage;
    this.model = model;
  }
  private BuildContent(message: ChatMessageType) {
    if (message.role === "user" || message.executions?.length === 0) {
      return message.content;
    }
    const reducedExecutions = message.executions?.map((execution) => ({
      steps: execution.steps,
      executed: `with intension:'${execution.msg}' does action:'${JSON.stringify(execution.cmd.action)}' performed with parameters '${JSON.stringify(execution.cmd.param)}'`,
      output:
        (execution.terminalOutput || "").split(" ").slice(-40).join(" ") +
        " [Last 40 words]",
      error:
        (execution.terminalError || "").split(" ").slice(-40).join(" ") +
        " [Last 40 words]",
      success: execution.isSuccess + `(${execution.exitCode})`,
    }));
    const imageBase64 =
      message.imageBase64 && message.imageBase64.length > 0
        ? "[Image Present]"
        : "[No Image]";
    return JSON.stringify({
      msg: message.content,
      imageBase64: imageBase64,
      executions: reducedExecutions,
    });
  }
  private GetContextReady(chatHistory: ChatMessageType[]) {
    return chatHistory.map((message) => ({
      role: message.role,
      content: this.BuildContent(message),
    }));
  }
  private async BuildContext(): Promise<ChatMessageType[]> {
    const userId = this.userId;
    const sessionId = this.sessionId;
    const userMessage = this.userMessage;
    const rawPrevChat: ChatMessageType[] =
      (await getChat(userId, sessionId, 10))?.chat || [];

    const prevChat = this.GetContextReady(rawPrevChat);
    let summaryChat: ChatMessageType[] = [];
    const summarySessionDoc: any = await SessionModel.findOne({
      userId,
      title: `summary_chat_${sessionId}`,
    });
    if (summarySessionDoc) {
      summaryChat =
        (await getChat(userId, summarySessionDoc._id.toString(), 1))?.chat ||
        [];
    }
    const chatHistory: ChatMessageType[] = [
      ...summaryChat,
      ...prevChat,
      {
        role: "user",
        content: userMessage,
      },
    ];
    return chatHistory;
  }
  private async BroadCastTheState(
    workingOn: string = "Working...",
    msg: string = "",
    cmd?: string,
  ) {
    sendToUser(this.userId, {
      type: "ai_data",
      sessionId: this.sessionId,
      data: {
        workingon: workingOn,
        msg: msg,
        cmd:
          cmd !== undefined ? cmd : this.command || this.lastExecutedCmd || "",
        executions: this.executions,
      },
    });
    const liveSession = activeSessions.get(this.sessionId);
    if (liveSession) {
      liveSession.workingon = workingOn || this.workingOn || "Working...";
      liveSession.executions = this.executions;
    }
  }
  private ExplainAction(action: string, param: any): string {
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

  private async StartLoopChat(
    maxLimit: number = 15,
    chatHistory: ChatMessageType[],
  ) {
    while (this.retries <= maxLimit) {
      const ChatMsgs: ChatMessageType[] = [
        ...chatHistory,
        ...this.commandRunningMsgs,
      ];
      this.BroadCastTheState();
      this.aiResponse = await callAI(this.model.provider, {
        userId: this.userId,
        chatMessages: ChatMsgs,
        session: this.sessionId,
        instructions,
        isJson: true,
        isLiveModel: this.model.isLiveModel,
        retryCount: 0,
        model: this.model.name,
      });
      const { cmd, workingon, msg, success } = this.aiResponse;
      this.BroadCastTheState(workingon, msg, cmd);
      this.commandRunningMsgs.push({
        role: "assistant",
        content: JSON.stringify(this.aiResponse.rawContent),
      });
      if (!success) break;
      if (
        cmd == null ||
        String(cmd).trim() === "" ||
        (typeof cmd === "object" && !cmd.action)
      ) {
        break;
      }
      this.command =
        typeof cmd === "object" ? JSON.stringify(cmd) : String(cmd);

      if (this.lastRawCmd === this.command && !this.isSuccessState) {
        this.duplicateCMDCount++;
        if (this.duplicateCMDCount >= 3) {
          break;
        }
      } else {
        this.duplicateCMDCount = 0;
      }
      this.lastRawCmd = this.command;

      try {
        const parsedCMD: CommandTypes = JSON.parse(this.command);
        await this.ExecuteStep(parsedCMD, ChatMsgs);
      } catch (err: any) {
        this.terminalError += `\nRuntime Error: ${err.message}`;
        this.isSuccessState = false;
        this.commandRunningMsgs.push({
          role: "user",
          content: JSON.stringify(
            {
              status: "failed",
              command_executed: this.command || "",
              terminal_output: this.terminalOutput || "No output",
              terminal_error: this.terminalError || "",
            },
            null,
            2,
          ),
        });
      }
      this.retries++;
    }
  }
  private async ExecuteStep(
    command: CommandTypes,
    ChatMsgs: ChatMessageType[],
  ) {
    const action = command.action;
    const params = command.param;
    const stepStartTime = Date.now();
    const commandOutput: CommandParserResponseType = await commandParser(
      this.userId,
      command,
      ChatMsgs,
    );
    const stepDuration = ((Date.now() - stepStartTime) / 1000).toFixed(1) + "s";

    const currentCwd =
      (commandOutput as any)?.cwd ||
      (typeof params === "object" && (params as any)?.cwd) ||
      "";
    if (commandOutput.imageBase64) {
      this.capturedImage = commandOutput.imageBase64;
    }
    const rawOutput = commandOutput.terminalOutput || "";
    if (rawOutput.split(" ").length > 50) {
      this.terminalOutput =
        "[...truncated earlier lines...]\n" +
        rawOutput.split(" ").slice(-50).join(" ");
    } else {
      this.terminalOutput = rawOutput;
    }
    this.executions.push({
      steps: this.executions.length + 1,
      cmd: {
        action: action,
        param: params,
      },
      msg: commandOutput.msg || this.aiResponse?.msg || "",
      terminalError: commandOutput.terminalError || "",
      terminalOutput: commandOutput.terminalOutput || "",
      isSuccess: commandOutput.isSuccess,
      exitCode: commandOutput.exitCode?.toString() || "",
      duration: stepDuration,
      cwd: currentCwd,
      imageBase64: commandOutput.imageBase64 || "",
    });
    const actionDesc = this.ExplainAction(action, params);
    this.BroadCastTheState("Completed " + actionDesc, "", this.command);

    let currentError = commandOutput.terminalError || "";
    if (
      commandOutput.exitCode !== undefined &&
      commandOutput.exitCode !== null
    ) {
      currentError += `\nEXIT CODE: ${commandOutput.exitCode}`;
    }
    this.lastStepError = currentError;
    this.isSuccessState = commandOutput.isSuccess;
    let aiTerminalError = currentError;
    if (this.duplicateCMDCount >= 1) {
      aiTerminalError =
        system_warning(
          this.lastExecutedCmd || "",
          this.duplicateCMDCount,
          this.terminalError || "",
        ) + "\n\n";
    }
    const feedbackContent = {
      status: this.isSuccessState ? "success" : "failed",
      command_executed: this.command || "",
      summary: commandOutput.msg || "",
      terminal_output: this.terminalOutput || "No output",
      terminal_error: aiTerminalError || "",
    };
    this.BroadCastTheState("✍️ Finalizing response...", "", "");
    this.commandRunningMsgs.push({
      role: "user",
      content: JSON.stringify(feedbackContent, null, 2),
    });
  }
  private async SaveTurn() {
    const totalWorkedSeconds = Math.max(
      1,
      Math.round((Date.now() - this.overstart) / 1000),
    );
    const finalMsg =
      this.aiResponse?.msg ||
      (this.retries >= 15
        ? "Maximum try reached!"
        : "AI service encountered an issue. Please try again Later.");
    const finalTurnSave: ChatMessageType[] = [
      {
        role: "user",
        content: this.userMessage,
      },
      {
        role: "assistant",
        content: finalMsg,
        executions: this.executions || [],
        imageBase64: this.capturedImage,
        workedSeconds: totalWorkedSeconds,
      },
    ];
    await setChat(this.userId, this.sessionId, finalTurnSave);
    return {
      cmd: this.lastExecutedCmd || "",
      msg: finalMsg,
      terminalOutput: this.terminalOutput || "",
      terminalError: this.isSuccessState
        ? ""
        : this.lastStepError || this.terminalError || "",
      imageBase64: this.capturedImage || "",
      executions: this.executions || [],
      workedSeconds: totalWorkedSeconds,
    };
  }
  public async run() {
    const chatHistory = await this.BuildContext();
    await this.StartLoopChat(15, chatHistory);
    return await this.SaveTurn();
  }
}
