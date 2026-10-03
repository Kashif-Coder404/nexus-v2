import { ChatMessageType } from "../Types/ChatTypes.js";

export const buildAiContext = (chatHistory: ChatMessageType[]) => {
  return chatHistory.map((message) => ({
    role: message.role,
    content: buildContent(message),
  }));
};
const buildContent = (message: ChatMessageType) => {
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
};
