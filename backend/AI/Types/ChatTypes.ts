import { CommandExecutionType } from "./AIResponseTypes.js";

export type ChatMessageType = {
  role: string;
  content: string;
  executions?: CommandExecutionType[];
  imageBase64?: string;
  workedSeconds?: number;
};
