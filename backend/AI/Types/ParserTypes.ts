import { ChatMessageType } from "./ChatTypes.js";

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
    isDeepSearch: boolean;
    name: string;
    extention?: string;
  };
  search: {
    path?: string;
    expected_name: string;
    extension?: string;
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
// export type HistoryTypes = BaseCommandType<"history" | "delete_history">;

// export type SearchAppParameters = {
//   isDeepSearch: boolean;
//   name: string;
//   extention?: string;
// };
// export type GlobalSearchType = {
//   path?: string;
//   expected_name: string;
//   extension?: string;
// };
// export type SystemInfoType = BaseCommandType<"system_info">;

// export type SearchTypes =
//   | BaseCommandType<"search", GlobalSearchType>
//   | BaseCommandType<"search_app", SearchAppParameters>;
// export type CaptureScreenType = BaseCommandType<"capture_screen", string>;

// export interface SetVolumeType {
//   action: "set_volume";
//   level: number;
//   times?: number;
// }
// export interface VolumeUpDownType {
//   action: "volume_up" | "volume_down";
//   level?: number;
//   times: number;
// }
// export interface OtherVolumeType {
//   action: "current_volume" | "mute" | "unmute";
//   level?: number;
//   times?: number;
// }

// export type VolumeType = SetVolumeType | VolumeUpDownType | OtherVolumeType;

// export type VolumeCommandType = BaseCommandType<"volume", VolumeType>;

// export type CommandTypes =
//   | SearchTypes
//   | HistoryTypes
//   | SystemInfoType
//   | MemoryParametersTypes
//   | CaptureScreenType
//   | VolumeCommandType
//   | BaseCommandType<string, Record<string, unknown>>;

// export type commandParserType = {
//   cmd: string | CommandTypes;
//   msg: string;
//   terminalOutput: string;
//   terminalError: string;
//   isSuccess: boolean;
//   exitCode?: number;
//   imageBase64?: string;
// };

// export type MemoryRead = {
//   alias?: string;
//   category?: string;
// };
// export type MemoryWrite = {
//   alias: string;
//   value: string;
//   category: string;
// };
// export type MemoryDelete = {
//   value: string;
//   alias?: string;
//   category?: string;
// };
// export type BaseCommandType<A extends string = string, P = unknown> = {
//   action: A;
//   param?: P;
//   timeout?: number;
// };

// export type MemoryParametersTypes =
//   | BaseCommandType<"memory_write", MemoryWrite>
//   | BaseCommandType<"memory_read", MemoryRead>
//   | BaseCommandType<"memory_delete", MemoryDelete>;

// export type HistoryTypes = BaseCommandType<"history" | "delete_history">;

// export type SearchAppParameters = {
//   isDeepSearch: boolean;
//   name: string;
//   extention?: string;
// };
// export type GlobalSearchType = {
//   path?: string;
//   expected_name: string;
//   extension?: string;
// };
// export type SystemInfoType = BaseCommandType<"system_info">;

// export type SearchTypes =
//   | BaseCommandType<"search", GlobalSearchType>
//   | BaseCommandType<"search_app", SearchAppParameters>;
// export type CaptureScreenType = BaseCommandType<"capture_screen", string>;

// export interface SetVolumeType {
//   action: "set_volume";
//   level: number;
//   times?: number;
// }
// export interface VolumeUpDownType {
//   action: "volume_up" | "volume_down";
//   level?: number;
//   times: number;
// }
// export interface OtherVolumeType {
//   action: "current_volume" | "mute" | "unmute";
//   level?: number;
//   times?: number;
// }

// export type VolumeType = SetVolumeType | VolumeUpDownType | OtherVolumeType;

// export type VolumeCommandType = BaseCommandType<"volume", VolumeType>;

// export type CommandTypes =
//   | SearchTypes
//   | HistoryTypes
//   | SystemInfoType
//   | MemoryParametersTypes
//   | CaptureScreenType
//   | VolumeCommandType
//   | BaseCommandType<string, Record<string, unknown>>;
