import { useState } from "react";
import { useAppContext } from "../context/provider";
import { sendChatMessage, fetchChatHistory } from "../services/chatService";

export function useChat() {
  const {
    isLoading,
    isOnline,
    chatHistory,
    setChatHistory,
    msg,
    setMsg,
    session,
    setSession,
    behaviour,
    setBehaviour,
    createNewSession,
  } = useAppContext();

  const [isSending, setIsSending] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const sendMessage = async () => {
    if (!msg.trim() || isSending) return;
    const userPrompt = msg;
    setMsg("");
    setIsSending(true);

    // 1. Append user message locally
    setChatHistory((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: { msg: userPrompt } },
    ]);

    try {
      // 2. Network request to backend API
      const response = await sendChatMessage(userPrompt, session, behaviour);
      const aiResponse = response.data || {};

      const aiMsg = aiResponse.lastAIMsg || response.message || "No response text";
      const cmd = aiResponse.lastCMD || "";
      const terminal = aiResponse.terminal || "";
      const terminalError = aiResponse.terminalError || "";
      const imageBase64 = aiResponse.imageBase64 || "";

      // 3. Append AI response
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "nexus",
          content: {
            msg: aiMsg,
            cmd,
            terminal,
            terminalError,
            imageBase64,
          },
        },
      ]);
    } catch (error: any) {
      console.error("[sendChatMessage error]", error);
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "nexus",
          content: {
            msg: `❌ Error sending message: ${error.message || "Failed to communicate with Nexus backend"}`,
          },
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const loadSessionHistory = async (targetSession?: string) => {
    const sessionToFetch = targetSession || session;
    setIsFetchingHistory(true);
    try {
      const result = await fetchChatHistory(sessionToFetch);
      if (result.response && Array.isArray(result.response)) {
        const formattedHistory = result.response.map((item: any, idx: number) => {
          let contentObj: any = { msg: item.content || item.message || "" };

          try {
            const parsed = JSON.parse(item.content);
            if (parsed && typeof parsed === "object") {
              // Extract text message
              const textMsg = parsed.msg || parsed.message || item.content;
              
              // Extract command if present
              let rawCmd = parsed.cmd || parsed.cmdRunByAi;
              let cmdStr = rawCmd ? (typeof rawCmd === "string" ? rawCmd : JSON.stringify(rawCmd)) : "";
              
              // Extract terminal outputs
              let termStr = parsed.terminal || parsed.terminaloutput || "";
              let errStr = parsed.terminalError || parsed.terminalerror || "";
              let base64Str = parsed.imageBase64 || "";

              contentObj = {
                msg: typeof textMsg === "string" ? textMsg : JSON.stringify(textMsg),
                cmd: cmdStr,
                terminal: termStr,
                terminalError: errStr,
                imageBase64: base64Str,
              };
            }
          } catch (e) {
            // Fallback: not valid JSON, leave as raw string
          }

          return {
            id: item._id || `hist-${idx}`,
            role: item.role === "assistant" ? "nexus" : "user",
            content: contentObj,
          };
        });
        setChatHistory(formattedHistory);
      }
    } catch (error) {
      console.error("[loadSessionHistory error]", error);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  return {
    isLoading,
    isOnline,
    isSending,
    isFetchingHistory,
    chatHistory,
    msg,
    setMsg,
    session,
    setSession,
    behaviour,
    setBehaviour,
    sendMessage,
    loadSessionHistory,
    createNewSession,
  };
}
