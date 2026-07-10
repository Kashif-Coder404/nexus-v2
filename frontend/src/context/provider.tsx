import { createContext, useContext, useEffect, useState, useRef } from "react";

const AppContext = createContext<any>(null);
export const AppProvider = ({ children }: { children: any }) => {
  interface ChatHistory {
    id: number;
    role: "nexus" | "user";
    content: {
      msg: string;
      cmd: string;
      terminal: string;
      terminalError: string;
    };
  }

  const [isLoading, setIsLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [msg, setMsg] = useState("");
  const [session, setSession] = useState("session_" + crypto.randomUUID());

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function handleHealthCheck() {
      try {
        const res: any = await fetch("http://localhost:3100/api/health");
        const data = await res.json();
        console.log("First Message", data);
        // live status of server required!
        const aiResponse = data.data;
        const aiMsg = aiResponse.lastAIMsg;
        const cmd: string = aiResponse.lastCMD;
        const terminal: string = aiResponse.terminal;
        const terminalError: string = aiResponse.terminalError;
        const chatData: ChatHistory = {
          id: Date.now(),
          role: "nexus",
          content: {
            msg: aiMsg,
            cmd: cmd || "",
            terminal: terminal || "",
            terminalError: terminalError || "",
          },
        };
        if (res.status === 200) {
          setChatHistory([chatData]);
          console.log(chatHistory);
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        throw new Error("Server is not responding");
      } catch (error: any) {
        let errorMsg = error.message;
        // Native fetch throws 'Failed to fetch' when the server is completely offline
        if (errorMsg === "Failed to fetch") {
          errorMsg = "Server is not responding";
        }

        setChatHistory((prev: any) => [
          ...prev,
          {
            id: Date.now(),
            role: "nexus",
            content: {
              msg: errorMsg,
              cmd: "",
              terminal: "",
              terminalError: "",
            },
          },
        ]);
        setIsLoading(false);
      }
    }
    handleHealthCheck();
  }, []);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        chatHistory,
        msg,
        session,
        setMsg,
        setSession,
        setChatHistory,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
