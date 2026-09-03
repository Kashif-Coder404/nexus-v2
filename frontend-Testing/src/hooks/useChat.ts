import { useState } from "react";
import { useAppContext } from "../context/provider";
import {
  sendChatMessage,
  pairDevice,
  PROVIDER_MODELS,
} from "../services/chatService";

export function useChat() {
  const {
    isLoading,
    isOnline,
    backendUrl,
    updateBackendUrl,
    refreshHealth,

    token,
    user,
    isAuthenticated,
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
  } = useAppContext();

  const [isSending, setIsSending] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isPairing, setIsPairing] = useState(false);

  const sendMessage = async () => {
    if (!msg.trim() || isSending) return;
    const userPrompt = msg.trim();
    setMsg("");
    setIsSending(true);

    // 1. Append user prompt locally
    const userMsgId = Date.now();
    setChatHistory((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: { msg: userPrompt },
        timestamp: userMsgId,
      },
    ]);

    try {
      // 2. Dispatch to backend API with selected model and provider
      const modelObj = PROVIDER_MODELS[selectedProvider]?.models?.find(
        (m) => m.id === selectedModel
      );
      const isLiveModel = modelObj?.isLiveModel || selectedModel === "gemini-3.1-flash-live-preview";

      const response = await sendChatMessage(
        userPrompt,
        session,
        behaviour,
        {
          provider: selectedProvider as any,
          name: selectedModel,
          isLiveModel: isLiveModel,
        }
      );

      // 3. Update active session if backend returned an assigned MongoDB session ID
      const effectiveSessionId = response.sessionId || session;
      if (response.sessionId && response.sessionId !== session) {
        setSession(response.sessionId);
      }

      // 4. Update saved session title in localStorage
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("nexus_saved_sessions");
        let list = stored ? JSON.parse(stored) : [];
        const existingIdx = list.findIndex((s: any) => s.id === effectiveSessionId || s.id === session);
        const titleSnippet =
          userPrompt.length > 28 ? userPrompt.slice(0, 28) + "..." : userPrompt;

        if (existingIdx >= 0) {
          list[existingIdx].id = effectiveSessionId;
          list[existingIdx].title = titleSnippet;
          list[existingIdx].updatedAt = Date.now();
        } else {
          list.unshift({
            id: effectiveSessionId,
            title: titleSnippet,
            updatedAt: Date.now(),
          });
        }
        localStorage.setItem("nexus_saved_sessions", JSON.stringify(list));
      }

      const aiResponse = response.data || {};
      const aiMsg =
        aiResponse.lastAIMsg || response.message || "No response text";
      const cmd = aiResponse.lastCMD || "";
      const terminal = aiResponse.terminal || "";
      const terminalError = aiResponse.terminalError || "";
      const imageBase64 = aiResponse.imageBase64 || "";

      // 5. Append AI response
      const aiMsgId = Date.now();
      setChatHistory((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: "nexus",
          content: {
            msg: aiMsg,
            cmd,
            terminal,
            terminalError,
            imageBase64,
          },
          timestamp: aiMsgId,
        },
      ]);

      // 6. Refresh user sessions list from backend
      loadUserSessions();
    } catch (error: any) {
      console.error("[sendChatMessage error]", error);
      const errMsgId = Date.now();
      setChatHistory((prev) => [
        ...prev,
        {
          id: errMsgId,
          role: "nexus",
          content: {
            msg: `❌ **Error**: ${
              error.message || "Failed to communicate with Nexus backend"
            }`,
          },
          timestamp: errMsgId,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const loadSessionHistory = async (targetSession?: string) => {
    setIsFetchingHistory(true);
    try {
      await loadHistoryForSession(targetSession || session);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const pairLocalDevice = async (pairingCode: string) => {
    setIsPairing(true);
    try {
      const result = await pairDevice(pairingCode.trim().toUpperCase());
      return result;
    } finally {
      setIsPairing(false);
    }
  };

  return {
    isLoading,
    isOnline,
    isSending,
    isFetchingHistory,
    isPairing,
    backendUrl,
    updateBackendUrl,
    refreshHealth,

    token,
    user,
    isAuthenticated,
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
    msg,
    setMsg,
    behaviour,
    setBehaviour,
    sendMessage,
    loadSessionHistory,
    pairLocalDevice,
  };
}
