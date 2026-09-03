import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  checkServerHealth,
  getBackendUrl,
  setBackendUrl as saveBackendUrl,
  setAuthToken,
  removeAuthToken,
  loginUser,
  signupUser,
  deleteChatSession,
  fetchChatHistory,
  fetchUserSessions,
  isValidMongoId,
  PROVIDER_MODELS,
} from "../services/chatService";

export interface ChatMessage {
  id: number | string;
  role: "nexus" | "user";
  content: {
    msg: string;
    cmd?: string;
    terminal?: string;
    terminalError?: string;
    imageBase64?: string;
  };
  timestamp?: number;
}

export interface UserProfile {
  _id?: string;
  name?: string;
  email?: string;
  devices?: Array<{
    _id: string;
    deviceName?: string;
    createdAt?: string;
  }>;
}

export interface SessionItem {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: number;
}

interface AppContextType {
  // Connection & Health
  isLoading: boolean;
  isOnline: boolean;
  backendUrl: string;
  updateBackendUrl: (url: string) => void;
  refreshHealth: () => Promise<void>;

  // Auth
  token: string;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  guestLogin: (apiKey?: string) => void;
  logout: () => void;
  setCustomToken: (customToken: string) => void;

  // Session & History Management
  session: string;
  setSession: (session: string) => void;
  savedSessions: SessionItem[];
  createNewSession: () => void;
  switchSession: (sessionId: string) => void;
  deleteCurrentSession: (sessionId?: string) => Promise<void>;
  loadUserSessions: () => Promise<void>;

  // Model & Provider Selection
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // Chat State
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  msg: string;
  setMsg: (msg: string) => void;
  behaviour: string;
  setBehaviour: (behaviour: string) => void;
  loadHistoryForSession: (sessionId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [backendUrl, setBackendUrlState] = useState<string>(() => getBackendUrl());
  const [token, setTokenState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nexus_token") || "";
    }
    return "";
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("nexus_user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [savedSessions, setSavedSessions] = useState<SessionItem[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexus_saved_sessions");
      if (stored) {
        try {
          const list: SessionItem[] = JSON.parse(stored);
          // Filter out legacy non-mongo IDs
          return list.filter((item) => isValidMongoId(item.id));
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Active Session: only valid MongoDB ObjectId or empty for new thread
  const [session, setSessionState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("nexus_active_session");
      if (active && isValidMongoId(active)) {
        return active;
      }
      // Remove any legacy invalid session format
      localStorage.removeItem("nexus_active_session");
    }
    return "";
  });

  const [selectedProvider, setSelectedProviderState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nexus_provider") || "gemini";
    }
    return "gemini";
  });

  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nexus_model") || "gemini-3.5-flash-lite";
    }
    return "gemini-3.5-flash-lite";
  });

  const setSelectedProvider = (provider: string) => {
    setSelectedProviderState(provider);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_provider", provider);
    }
    const available = PROVIDER_MODELS[provider]?.models;
    if (available && available.length > 0) {
      const defaultForProvider = available[0].id;
      setSelectedModelState(defaultForProvider);
      if (typeof window !== "undefined") {
        localStorage.setItem("nexus_model", defaultForProvider);
      }
    }
  };

  const setSelectedModel = (model: string) => {
    setSelectedModelState(model);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_model", model);
    }
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [behaviour, setBehaviour] = useState("friendly");

  const initialLoadedRef = useRef(false);

  const updateBackendUrl = (url: string) => {
    const trimmed = url.trim().replace(/\/+$/, "");
    saveBackendUrl(trimmed);
    setBackendUrlState(trimmed);
    refreshHealth();
  };

  const setSession = (newSessionId: string) => {
    setSessionState(newSessionId);
    if (typeof window !== "undefined") {
      if (isValidMongoId(newSessionId)) {
        localStorage.setItem("nexus_active_session", newSessionId);
      } else {
        localStorage.removeItem("nexus_active_session");
      }
    }
  };

  const setCustomToken = (customToken: string) => {
    const trimmed = customToken.trim();
    setAuthToken(trimmed);
    setTokenState(trimmed);
  };

  const loadUserSessions = useCallback(async () => {
    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("nexus_token") : "");
    if (!currentToken) return;
    try {
      const res = await fetchUserSessions();
      if (res.success && Array.isArray(res.data)) {
        const formatted: SessionItem[] = res.data
          .filter((item: any) => isValidMongoId(item._id))
          .map((item: any) => ({
            id: item._id,
            title: item.title && item.title !== "New Chat" ? item.title : `Chat ${item._id.slice(-4)}`,
            updatedAt: item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now(),
          }));
        setSavedSessions(formatted);
        if (typeof window !== "undefined") {
          localStorage.setItem("nexus_saved_sessions", JSON.stringify(formatted));
        }
      }
    } catch (e) {
      console.warn("Could not fetch user sessions:", e);
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await loginUser(email, pass);
    if (res.success && res.data) {
      const jwt = res.data.token;
      const usr = res.data.user;
      setAuthToken(jwt);
      setTokenState(jwt);
      if (usr) {
        setUser(usr);
        localStorage.setItem("nexus_user", JSON.stringify(usr));
      }
      refreshHealth();
      loadUserSessions();
      if (session && isValidMongoId(session)) {
        loadHistoryForSession(session);
      }
    }
  };

  const signup = async (name: string, email: string, pass: string) => {
    const res = await signupUser(name, email, pass);
    if (res.success && res.data) {
      const jwt = res.data.token;
      const usr = res.data.user;
      setAuthToken(jwt);
      setTokenState(jwt);
      if (usr) {
        setUser(usr);
        localStorage.setItem("nexus_user", JSON.stringify(usr));
      }
      refreshHealth();
      loadUserSessions();
      if (session && isValidMongoId(session)) {
        loadHistoryForSession(session);
      }
    }
  };

  const guestLogin = (apiKey?: string) => {
    const key = apiKey || import.meta.env.VITE_NEXUS_API_KEY || "MyCurrentAPI";
    setAuthToken(key);
    setTokenState(key);
    const guestUser = { name: "Guest User", email: "guest@nexus.local" };
    setUser(guestUser);
    localStorage.setItem("nexus_user", JSON.stringify(guestUser));
    refreshHealth();
  };

  const logout = () => {
    removeAuthToken();
    setTokenState("");
    setUser(null);
    setChatHistory([]);
  };

  const createNewSession = () => {
    setSession("");
    setChatHistory([]);
  };

  const switchSession = (targetSessionId: string) => {
    setSession(targetSessionId);
    if (isValidMongoId(targetSessionId)) {
      loadHistoryForSession(targetSessionId);
    } else {
      setChatHistory([]);
    }
  };

  const deleteCurrentSession = async (targetSessionId?: string) => {
    const idToDelete = targetSessionId || session;
    try {
      if (idToDelete && isValidMongoId(idToDelete)) {
        await deleteChatSession(idToDelete);
      }
    } catch (e) {
      console.warn("Delete session request error:", e);
    } finally {
      setSavedSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== idToDelete);
        if (typeof window !== "undefined") {
          localStorage.setItem("nexus_saved_sessions", JSON.stringify(filtered));
        }
        return filtered;
      });

      if (idToDelete === session || !idToDelete) {
        createNewSession();
      }
    }
  };

  const loadHistoryForSession = useCallback(async (sessionIdToFetch: string) => {
    if (!sessionIdToFetch || !isValidMongoId(sessionIdToFetch)) {
      setChatHistory([]);
      return;
    }

    try {
      const result = await fetchChatHistory(sessionIdToFetch);
      const chatList =
        result?.data?.chat || result?.response || (Array.isArray(result) ? result : []);

      if (Array.isArray(chatList) && chatList.length > 0) {
        const formattedHistory: ChatMessage[] = chatList.map(
          (item: any, idx: number) => {
            let contentObj: any = { msg: "" };

            if (typeof item.content === "string") {
              try {
                const parsed = JSON.parse(item.content);
                if (parsed && typeof parsed === "object") {
                  contentObj = {
                    msg: parsed.msg || parsed.message || parsed.lastAIMsg || item.content,
                    cmd: parsed.cmd || parsed.cmdRunByAi || "",
                    terminal: parsed.terminal || parsed.terminalOutput || "",
                    terminalError: parsed.terminalError || "",
                    imageBase64: parsed.imageBase64 || "",
                  };
                } else {
                  contentObj = { msg: item.content };
                }
              } catch {
                contentObj = { msg: item.content };
              }
            } else if (item.content && typeof item.content === "object") {
              contentObj = {
                msg: item.content.msg || item.content.message || item.content.lastAIMsg || "",
                cmd: item.content.cmd || "",
                terminal: item.content.terminal || "",
                terminalError: item.content.terminalError || "",
                imageBase64: item.content.imageBase64 || "",
              };
            }

            return {
              id: item._id || `hist-${idx}-${Date.now()}`,
              role:
                item.role === "assistant" || item.role === "nexus"
                  ? "nexus"
                  : "user",
              content: contentObj,
            };
          }
        );

        setChatHistory(formattedHistory);
      } else {
        setChatHistory([]);
      }
    } catch (e) {
      console.warn("[Auto-load history warning]:", e);
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const data = await checkServerHealth();
      setIsOnline(true);
      return data;
    } catch (error: any) {
      setIsOnline(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Auto-Load Effect
  useEffect(() => {
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;

    async function initialize() {
      try {
        await refreshHealth();
      } catch (e) {
        console.warn("Initial health check failed:", e);
      }

      if (token) {
        await loadUserSessions();
      }

      // Auto load active session history if authenticated and valid ID
      if (token && session && isValidMongoId(session)) {
        await loadHistoryForSession(session);
      }
    }

    initialize();
  }, [refreshHealth, loadUserSessions, loadHistoryForSession, session, token]);

  useEffect(() => {
    if (token) {
      loadUserSessions();
    }
  }, [token, loadUserSessions]);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        isOnline,
        backendUrl,
        updateBackendUrl,
        refreshHealth,

        token,
        user,
        isAuthenticated: !!token,
        login,
        signup,
        guestLogin,
        logout,
        setCustomToken,

        session,
        setSession,
        savedSessions,
        createNewSession,
        switchSession,
        deleteCurrentSession,
        loadUserSessions,

        selectedProvider,
        setSelectedProvider,
        selectedModel,
        setSelectedModel,

        chatHistory,
        setChatHistory,
        msg,
        setMsg,
        behaviour,
        setBehaviour,
        loadHistoryForSession,
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
