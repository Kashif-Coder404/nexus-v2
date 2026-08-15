export type commandParserType = {
  cmd: string | CommandTypes;
  msg: string;
  terminalOutput: string;
  terminalError: string;
  isSuccess: boolean;
  exitCode?: number;
};

export type MemoryRead = {
  alias?: string;
  category?: string;
};
export type MemoryWrite = {
  alias: string;
  value: string;
  category: string;
};
export type MemoryDelete = {
  value: string;
  alias?: string;
  category?: string;
};
export type BaseCommandType<A extends string = string, P = unknown> = {
  action: A;
  param?: P;
  timeout?: number;
};

export type MemoryParametersTypes =
  | BaseCommandType<"memory_write", MemoryWrite>
  | BaseCommandType<"memory_read", MemoryRead>
  | BaseCommandType<"memory_delete", MemoryDelete>;

export type HistoryTypes = BaseCommandType<"history" | "delete_history">;

export type SearchAppParameters = {
  isDeepSearch: boolean;
  name: string;
  extention?: string;
};
export type GlobalSearchType = {
  path?: string;
  expected_name: string;
  extension?: string;
};
export type SystemInfoType = BaseCommandType<"system_info">;

export type SearchTypes =
  | BaseCommandType<"search", GlobalSearchType>
  | BaseCommandType<"search_app", SearchAppParameters>;
export type CaptureScreenType = BaseCommandType<"capture_screen", string>;

export interface SetVolumeType {
  action: "set_volume";
  level: number;
  times?: number;
}
export interface VolumeUpDownType {
  action: "volume_up" | "volume_down";
  level?: number;
  times: number;
}
export interface OtherVolumeType {
  action: "current_volume" | "mute" | "unmute";
  level?: number;
  times?: number;
}

export type VolumeType = SetVolumeType | VolumeUpDownType | OtherVolumeType;

export type VolumeCommandType = BaseCommandType<"volume", VolumeType>;

export type CommandTypes =
  | SearchTypes
  | HistoryTypes
  | SystemInfoType
  | MemoryParametersTypes
  | CaptureScreenType
  | VolumeCommandType
  | BaseCommandType<string, Record<string, unknown>>;

