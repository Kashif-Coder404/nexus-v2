export type ChatMessageType = UserMsg | AIMsg | SystemMsg;
type UserMsg = {
  role: "user";
  msg: string;
  timestamp: string;
};
type AIMsg = {
  role: "ai";
  msg: string;
  command?: string;
  terminalOutput?: string;
  terminalError?: string;
  timestamp: string;
};

type SystemMsg = {
  role: "system";
  msg: string;
  msgType: "welcome" | "error" | "info" | "warning" | "success";
  timestamp: string;
};
