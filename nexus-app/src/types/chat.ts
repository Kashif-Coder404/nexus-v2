import React from "react";

export interface UserProp {
  id: string;
  role: "user";
  message: string;
  content?: never;
  time: string;
  status: "sent" | "sending" | "error";
}

export interface AIBoxProps {
  id: string;
  role: "nexus";
  content: {
    AiMsg: string;
    terminal: string;
    terminalError: string;
    cmd: string;
  };
}

export type MessageItems = UserProp | AIBoxProps;

export interface AppContextType {
  messageID: string;
  message: string;
  setMessage: (message: string) => void;
  handleSend: () => Promise<void>;
  chatHistory: MessageItems[];
  setChatHistory: React.Dispatch<React.SetStateAction<MessageItems[]>>;
  isWorkingOn: string;
  setIsWorkingOn: (isWorkingOn: string) => void;
  isPermitted: boolean;
  setIsPermitted: (isPermitted: boolean) => void;
  isResponsed: boolean;
  setIsResponsed: (isResponsed: boolean) => void;
}
