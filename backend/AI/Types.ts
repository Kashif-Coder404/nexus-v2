export type ChatMessageType = {
  role: string;
  content: string;
};
export type CallNvidiaReturnType = {
  aiMsg: string;
  command: string;
  workingOn: string;
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
