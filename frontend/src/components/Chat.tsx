import { useEffect, useState, useRef } from "react";
import { useChat } from "../hooks/useChat";
import AIBOX from "./AIBox";
import UserBox from "./UserBox";
import { API_BASE_URL } from "../services/chatService";

const Chat = () => {
  const {
    isLoading,
    isOnline,
    isSending,
    chatHistory,
    msg,
    setMsg,
    session,
    sendMessage,
    loadSessionHistory,
    createNewSession,
  } = useChat();

  const [workingOn, setWorkingOn] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, workingOn, isLoading, isSending]);

  // Frontend Tab Close Warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSending || workingOn) {
        e.preventDefault();
        e.returnValue = "Nexus AI is actively processing a task. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSending, workingOn]);

  useEffect(() => {
    let wss: WebSocket;
    let reconnectTimer: any;

    const connectWS = () => {
      const wsHost = API_BASE_URL.replace(/^http/, "ws");
      wss = new WebSocket(wsHost);

      wss.onopen = () => console.log("[WebSocket] Connected");
      
      wss.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "ai_data") setWorkingOn(data.data?.workingon || "Processing task");
          if (data.type === "ai_done") setWorkingOn("");
        } catch (error) {}
      };

      wss.onclose = () => {
        console.log("[WebSocket] Disconnected. Reconnecting in 3s...");
        reconnectTimer = setTimeout(connectWS, 3000);
      };

      wss.onerror = (err) => {
        console.error("[WebSocket] Error", err);
        wss.close();
      };
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimer);
      if (wss) {
        wss.onclose = null; // Prevent reconnect loop on unmount
        wss.close();
      }
    };
  }, []);

  return (
    <div className="chat-container">
      {/* Premium Header */}
      <header className="chat-header">
        <div className="brand-title">
          <span className="brand-icon">✧</span>
          Nexus AI
          <span className="session-badge" title={session}>
            {session.substring(0, 14)}...
          </span>
        </div>
        <div className="header-actions">
          <div className="status-indicator" title={isOnline ? "System Online" : "System Offline"}>
            <div className={`mini-status ${isOnline ? "online" : "offline"}`} />
          </div>
          <button className="icon-btn" onClick={() => loadSessionHistory()} title="Sync Session">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
          </button>
          <button className="icon-btn" onClick={createNewSession} title="New Chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </header>

      {/* Message Feed */}
      <div className="chat-feed">
        {chatHistory.length === 0 && !isLoading && (
          <div className="empty-state">
            <div className="empty-logo">✧</div>
            <h3>How can I help you today?</h3>
            <p>I am your intelligent assistant. I can execute commands, manage tasks, and help you code.</p>
          </div>
        )}

        {chatHistory.map((msgItem: any, index: number) => {
          const key = msgItem.id || `msg-${index}`;
          if (msgItem.role === "user") return <UserBox key={key} message={msgItem.content} />;
          if (msgItem.role === "nexus") {
            return (
              <AIBOX
                key={key}
                message={msgItem.content?.msg || msgItem.content?.aiMsg}
                cmd={msgItem.content?.cmd || ""}
                terminal={msgItem.content?.terminal || ""}
                terminalError={msgItem.content?.terminalError || ""}
                imageBase64={msgItem.content?.imageBase64 || ""}
              />
            );
          }
          return null;
        })}

        {workingOn && (
          <div className="ai-thinking">
            <div className="pulse-ring" />
            <span>{workingOn}...</span>
          </div>
        )}

        {isLoading && chatHistory.length === 0 && (
          <div className="ai-thinking">
            <div className="pulse-ring" />
            <span>Initializing Nexus Core...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Pill */}
      <div className="floating-input-wrapper">
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder={isSending ? "Nexus is thinking..." : "Message Nexus AI..."}
            value={msg}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            onChange={(e) => setMsg(e.target.value)}
            disabled={isLoading || isSending}
            autoFocus
          />
          <button className="send-button" onClick={sendMessage} disabled={isLoading || isSending || !msg.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
