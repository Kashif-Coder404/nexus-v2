import { AIBoxProps } from "@/components/AiBox";

import { UserProp } from "@/components/UserBox";
import React, { createContext, useContext, useState, ReactNode } from "react";

const AppContext = createContext<AppContextType | null>(null);
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
}
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const API_KEY = process.env.EXPO_PUBLIC_NEXUS_API_KEY;
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<MessageItems[]>([]);
  const [messageID, setMessageID] = useState("");
  const [session, setSession] = useState<string>(
    Date.now().toString(36) + Math.random().toString(36).substring(2),
  );
  const [isPermitted, setIsPermitted] = useState(false);
  const [isWorkingOn, setIsWorkingOn] = useState("");

  const handleSend = async () => {
    if (!message) return;
    console.log("Message: ", message);
    setMessage("");

    const currentMessageID = Date.now().toString();
    setMessageID(currentMessageID);

    const UserChatMsg: UserProp = {
      id: currentMessageID,
      role: "user",
      message: message,
      time: Date.now().toString(),
      status: "sending",
    };
    setChatHistory((prev) => [...prev, UserChatMsg]);
    try {
      const response = await fetch(
        "http://192.168.31.116:3100/api/chat/message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            message: message.toLowerCase(),
            session: session,
          }),
        },
      );
      // Update the specific message to sent
      setChatHistory((prev) => {
        return prev.map((msg) =>
          msg.id === currentMessageID && msg.role === "user"
            ? ({ ...msg, status: "sent" } as UserProp)
            : msg,
        );
      });

      const data: any = await response.json(); // Parses the response from the server

      const aiResponse: any = data.data;
      const aiMsg: string = aiResponse.lastAIMsg;
      const terminal: string =
        aiResponse.terminal === "Success" || aiResponse.terminal === "success"
          ? ""
          : aiResponse.terminal;
      const cmd: string = aiResponse.lastCMD;
      const terminalError: string = aiResponse.terminalError;

      const AIChatMsg: AIBoxProps = {
        id: Date.now().toString(),
        role: "nexus",
        content: {
          AiMsg: aiMsg,
          terminal: terminal,
          terminalError: terminalError,
          cmd: cmd,
        },
      };
      setChatHistory((prev) => [...prev, AIChatMsg]);
    } catch (error) {
      console.log("Error while sending message");

      const ErrorMsg: AIBoxProps = {
        id: Date.now().toString(),
        role: "nexus",
        content: {
          AiMsg: "Server is not responding.",
          terminal: "",
          terminalError: "",
          cmd: "",
        },
      };
      setChatHistory((prev: MessageItems[]) => {
        return [
          ...prev.map((msg) =>
            msg.id === currentMessageID && msg.role === "user"
              ? ({ ...msg, status: "error" } as UserProp)
              : msg,
          ),
          ErrorMsg,
        ];
      });
    }
  };

  return (
    <AppContext.Provider
      value={
        {
          messageID,
          message,
          setMessage,
          handleSend,
          chatHistory,
          setChatHistory,
          isWorkingOn,
          setIsWorkingOn,
          isPermitted,
          setIsPermitted,
        } as AppContextType
      }
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
