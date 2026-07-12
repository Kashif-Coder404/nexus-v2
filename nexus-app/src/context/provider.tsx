import { AIBoxProps } from "@/components/AiBox";
import * as LocalAuthentication from "expo-local-authentication";
import { UserProp } from "@/components/UserBox";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Alert } from "react-native";
import initWebsocket from "../../services/websocket.service";

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
  isResponsed: boolean;
  setIsResponsed: (isResponsed: boolean) => void;
}
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const API_KEY = process.env.EXPO_PUBLIC_NEXUS_API_KEY;
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<MessageItems[]>([]);
  const [messageID, setMessageID] = useState("");
  const [session, setSession] = useState<string>(
    Date.now().toString(36) + Math.random().toString(36).substring(2),
  );
  const [isResponsed, setIsResponsed] = useState(true);
  const [isPermitted, setIsPermitted] = useState(false);
  const [isWorkingOn, setIsWorkingOn] = useState("");
  const getAuthenticateRequest = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert("Hardware is not present");
      return false;
    }
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      Alert.alert("Authentication error");

      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to proceed",
    });
    if (result.success) {
      return true;
    } else {
      return false;
    }
  };
  const handleSend = async () => {
    if (!message) return;

    console.log("Message: ", message);
    const lowerCasedMsg: string = message.toLowerCase();
    if (
      (lowerCasedMsg.includes("shutdown") ||
        lowerCasedMsg.includes("turn off")) &&
      !isPermitted
    ) {
      setIsWorkingOn("AUTHENTICATE_REQUEST");
      const ispermit = await getAuthenticateRequest();
      if (!ispermit) {
        // const ErrorMsg: AIBoxProps = {
        //   id: Date.now().toString(),
        //   role: "nexus",
        //   content: {
        //     AiMsg: "Authentication failed",
        //     terminal: "",
        //     terminalError: "",
        //     cmd: "",
        //   },
        // };
        // setChatHistory((prev: MessageItems[]) => {
        //   return [
        //     ...prev.map((msg) =>
        //       msg.id === currentMessageID && msg.role === "user"
        //         ? ({ ...msg, status: "error" } as UserProp)
        //         : msg,
        //     ),
        //     ErrorMsg,
        //   ];
        // });
        setIsWorkingOn("AUTHENTICATION FAILED!");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsWorkingOn("");
        return;
      } else {
        setIsWorkingOn("AUTHENTICATION SUCCESS!");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsWorkingOn("");
      }
    }
    setMessage("");

    const currentMessageID = Date.now().toString();
    setMessageID(currentMessageID);

    const UserChatMsg: UserProp = {
      id: currentMessageID,
      role: "user",
      message: lowerCasedMsg,
      time: Date.now().toString(),
      status: "sending",
    };
    setChatHistory((prev) => [...prev, UserChatMsg]);
    setIsResponsed(false);
    try {
      await new Promise<void>((resolve, reject) => {
        const socket: WebSocket = initWebsocket();
        socket.onopen = () => resolve();
        socket.onerror = () => reject(new Error("Server connection failed"));
      });
      const response = await fetch(
        "http://192.168.31.116:3100/api/chat/message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            message: lowerCasedMsg,
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
      setIsResponsed(true);
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
    } catch (error: any) {
      console.log("Error while sending message");
      setIsWorkingOn("");
      setIsResponsed(true);

      const ErrorMsg: AIBoxProps = {
        id: Date.now().toString(),
        role: "nexus",
        content: {
          AiMsg: error.message || "server is not responding",
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
          isResponsed,
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
