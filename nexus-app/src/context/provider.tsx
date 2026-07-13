import React, { createContext, useContext, useState, ReactNode, useReducer } from "react";
import { AppContextType, MessageItems, UserProp, AIBoxProps } from "@/types/chat";
import { useAuth } from "@/hooks/useAuth";
import { chatReducer } from "@/hooks/chatReducer";
import { useChatAPI } from "@/hooks/useChatAPI";

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState("");
  const [chatHistory, dispatch] = useReducer(chatReducer, []);
  
  const [messageID, setMessageID] = useState("");
  const [session, setSession] = useState<string>(
    Date.now().toString(36) + Math.random().toString(36).substring(2),
  );
  const [isResponsed, setIsResponsed] = useState(true);
  const [isPermitted, setIsPermitted] = useState(false);
  const [isWorkingOn, setIsWorkingOn] = useState("");
  
  const { getAuthenticateRequest } = useAuth();
  const { sendMessageToAPI } = useChatAPI();

  // Backward compatibility for anything else that might use setChatHistory
  const setChatHistory: React.Dispatch<React.SetStateAction<MessageItems[]>> = (action) => {
      dispatch({ type: "SET_CHAT_HISTORY", payload: action });
  };

  const handleSend = async () => {
    if (!message) return;
    const lowerCasedMsg: string = message.toLowerCase();
    if (
      (lowerCasedMsg.includes("shutdown") ||
        lowerCasedMsg.includes("turn off")) &&
      !isPermitted
    ) {
      setIsWorkingOn("AUTHENTICATE_REQUEST");
      const ispermit = await getAuthenticateRequest();
      if (!ispermit) {
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
    
    dispatch({ type: "ADD_USER_MESSAGE", payload: UserChatMsg });
    setIsResponsed(false);
    
    try {
      const data = await sendMessageToAPI(lowerCasedMsg, session);
      
      dispatch({ type: "UPDATE_MESSAGE_STATUS", payload: { id: currentMessageID, status: "sent" } });
      setIsResponsed(true);

      const aiResponse = data.data;
      const aiMsg = aiResponse.lastAIMsg;
      const terminal =
        aiResponse.terminal === "Success" || aiResponse.terminal === "success"
          ? ""
          : aiResponse.terminal;
      const cmd = aiResponse.lastCMD;
      const terminalError = aiResponse.terminalError;

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
      
      dispatch({ type: "ADD_AI_MESSAGE", payload: AIChatMsg });
      setIsWorkingOn("");
    } catch (error: any) {
      console.log("Error while sending message", error);
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
      
      dispatch({ type: "UPDATE_MESSAGE_STATUS", payload: { id: currentMessageID, status: "error" } });
      dispatch({ type: "ADD_AI_MESSAGE", payload: ErrorMsg });
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
