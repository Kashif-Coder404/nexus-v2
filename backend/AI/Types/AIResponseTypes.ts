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
export type AIResponse = {
  cmd: string;
  msg: string;
  terminalOutput: string;
  terminalError: string;
  imageBase64?: string;
};
