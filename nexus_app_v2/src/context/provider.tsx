import { createContext, useContext, useState } from "react";
import { AppContext } from "./AppProvider";
import { ChatMessageType } from "@/types/ChatTypes";
import { AppContextType } from "@/types/AppContextTypes";

const useApp = () => {
  const result = useContext(AppContext);
  if (!result) {
    throw new Error("useApp must be used within AppProvider");
  }
  return result;
};

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const tempChatMessage: ChatMessageType[] = [
    {
      role: "ai",
      msg: "Hey, What can i do for you?",
      command: "",
      timestamp: `${Date.now()}`,
    },
  ];
  const [chatMessages, setChatMessages] =
    useState<ChatMessageType[]>(tempChatMessage);

  const values: AppContextType = {
    chatMessages,
    setChatMessages,
  };
  return <AppContext.Provider value={values}>{children}</AppContext.Provider>;
};

export { useApp, AppProvider };
