import { createContext, useContext, useEffect, useState, useRef } from "react";
import { checkServerHealth } from "../services/chatService";

export interface ChatMessage {
  id: number | string;
  role: "nexus" | "user";
  content: {
    msg: string;
    cmd?: string;
    terminal?: string;
    terminalError?: string;
  };
}

interface AppContextType {
  isLoading: boolean;
  isOnline: boolean;
  chatHistory: ChatMessage[];
  msg: string;
  session: string;
  setMsg: (msg: string) => void;
  setSession: (session: string) => void;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsLoading: (loading: boolean) => void;
  createNewSession: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 9);
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [session, setSession] = useState(() => "session_" + generateUUID());

  const hasFetched = useRef(false);

  const createNewSession = () => {
    const newSessionId = "session_" + generateUUID();
    setSession(newSessionId);
    setChatHistory([]);
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function handleHealthCheck() {
      try {
        const data = await checkServerHealth();
        console.log("[Nexus Health Check]", data);
        setIsOnline(true);
        
        const aiResponse = data.data || {};
        const aiMsg = aiResponse.lastAIMsg || "Nexus AI connected and ready.";
        const cmd: string = aiResponse.lastCMD || "";
        const terminal: string = aiResponse.terminal || "";
        const terminalError: string = aiResponse.terminalError || "";

        const chatData: ChatMessage = {
          id: Date.now(),
          role: "nexus",
          content: {
            msg: aiMsg,
            cmd,
            terminal,
            terminalError,
          },
        };

        setChatHistory([chatData]);
      } catch (error: any) {
        console.error("[Nexus Health Error]", error);
        setIsOnline(false);
        let errorMsg = error.message || "Failed to connect to backend server";
        if (errorMsg === "Failed to fetch") {
          errorMsg = "Backend server is offline (http://localhost:3100)";
        }

        setChatHistory([
          {
            id: Date.now(),
            role: "nexus",
            content: {
              msg: `⚠️ Connection Alert: ${errorMsg}. Please ensure the backend server is running.`,
            },
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    handleHealthCheck();
  }, []);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        isOnline,
        chatHistory,
        msg,
        session,
        setMsg,
        setSession,
        setChatHistory,
        setIsLoading,
        createNewSession,
      }}
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
