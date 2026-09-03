import type { ChatMessageType } from "./ChatTypes";

export type BaseCommandType<
  A extends keyof ActionTypes = keyof ActionTypes,
  P = ActionTypes[A],
> = {
  action: A;
  param?: P;
  timeout?: number;
};
export type MatchKeyType = keyof ActionTypes;
export interface ActionTypes {
  in_built: string; // AI MUST USE IT TO CALL REAL COMMANDS
  memory_read: { alias?: string; category?: string };
  memory_write: { alias: string; value: string; category: string };
  memory_delete: { value: string; alias?: string; category?: string };
  search_app: {
    isDeepSearch?: boolean;
    name: string;
    extension?: string;
    extention?: string;
  };
  search: {
    path?: string;
    expected_name: string;
    extension?: string;
    isDeepSearch?: boolean;
    type?: "folder" | "file" | "all";
  };
  capture_screen: string;
  volume_up: { level?: number; times: number };
  volume_down: { level?: number; times: number };
  current_volume: { level?: number; times?: number };
  mute: { level?: number; times?: number };
  unmute: { level?: number; times?: number };
}

export type ParametersType<p extends keyof ActionTypes> = ActionTypes[p];

export type CommandTypes = {
  action: keyof ActionTypes;
  param?: ParametersType<keyof ActionTypes>;
  timeout?: number;
};
export type commandParserType = {
  cmd: CommandTypes;
  session: string;
  chatMessages: ChatMessageType[];
};
export type CommandParserResponseType = {
  cmd: string;
  msg: string;
  terminalOutput: string;
  terminalError: string;
  isSuccess: boolean;
  exitCode?: number;
  imageBase64?: string;
};
