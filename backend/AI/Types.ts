export type ChatMessageType = {
  role: string;
  content: string;
};
export type CallNvidiaReturnType = {
  aiMsg: string;
  command: string;
  workingOn: string;
  success?: boolean;
};
export type GeminiResponse = {
  content: {
    cmd: string;
    msg: string;
    workingon: string;
  };
  success: boolean;
};
export type commandParserType = {
  cmd: string;
  msg: string;
  terminalOutput: string;
  terminalError: string;
  isSuccess: boolean;
  exitCode?: number;
};
export interface AIResponse {
  cmd: string;
  msg: string;
  terminalOutput: string;
  terminalError: string;
}
