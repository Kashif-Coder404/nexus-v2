import React, { useEffect, useState, useRef } from "react";
import { useChat } from "../hooks/useChat";
import { PROVIDER_MODELS } from "../services/chatService";
import AIBox from "./AIBox";
import UserBox from "./UserBox";
import PairModal from "./PairModal";
import SettingsModal from "./SettingsModal";
import Sidebar from "./Sidebar";

const Chat: React.FC = () => {
  const {
    isLoading,
    isOnline,
    isSending,
    isFetchingHistory,
    backendUrl,
    token,
    chatHistory,
    msg,
    setMsg,
    session,
    behaviour,
    setBehaviour,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    sendMessage,
    loadSessionHistory,
    createNewSession,
    user,
    logout,
  } = useChat();

  const [workingOn, setWorkingOn] = useState("");
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, workingOn, isLoading, isSending]);

  // Tab Close Warning when sending
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSending || workingOn) {
        e.preventDefault();
        e.returnValue =
          "Nexus AI is actively processing a command. Are you sure you want to exit?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSending, workingOn]);

  // WebSocket Live Updates from Cloud Backend
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectWS = () => {
      try {
        const rawToken = token || (typeof window !== "undefined" ? localStorage.getItem("nexus_token") || "" : "");
        const wsUrl = rawToken
          ? `${backendUrl.replace(/^http/, "ws")}?token=${encodeURIComponent(rawToken)}`
          : backendUrl.replace(/^http/, "ws");
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("[WS Client] Connected to backend live stream:", wsUrl);
          if (rawToken) {
            ws?.send(JSON.stringify({ type: "auth", token: rawToken }));
          }
        };

        ws.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "ai_data") {
              setWorkingOn(data.data?.workingon || "Analyzing and executing...");
            } else if (data.type === "ai_done") {
              setWorkingOn("");
            }
          } catch (e) {
            // Ignore non-json ws frames
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWS, 4000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (e) {
        console.error("[WS Connection Error]", e);
      }
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [backendUrl, token]);

  // Clean up working status when message finishes
  useEffect(() => {
    if (!isSending) {
      setWorkingOn("");
    }
  }, [isSending]);

  const handleCopySession = () => {
    navigator.clipboard.writeText(session);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  const handleQuickPrompt = (promptText: string) => {
    setMsg(promptText);
  };

  return (
    <div className="chat-layout-wrapper">
      {/* Session Drawer / Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Workspace */}
      <div className="chat-container">
        {/* Modals */}
        <PairModal
          isOpen={isPairModalOpen}
          onClose={() => setIsPairModalOpen(false)}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />

        {/* Header */}
        <header className="chat-header">
          <div className="header-left">
            <button
              className="icon-btn sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Conversations History"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div className="brand-title">
              <span className="brand-icon">✧</span>
              <span className="title-text">Nexus AI</span>
              <button
                className="session-badge"
                onClick={handleCopySession}
                title={`Active Session ID: ${session}\nClick to copy`}
              >
                {copiedSession ? "Copied!" : `${session.slice(0, 10)}...`}
              </button>
            </div>
          </div>

          <div className="header-actions">
            {/* AI Provider Selector */}
            <select
              className="behaviour-select provider-select"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              title="Select AI Provider"
            >
              {Object.entries(PROVIDER_MODELS).map(([provKey, provVal]) => (
                <option key={provKey} value={provKey}>
                  {provVal.label}
                </option>
              ))}
            </select>

            {/* AI Model Selector based on Provider */}
            <select
              className="behaviour-select model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              title={`Select Model for ${
                PROVIDER_MODELS[selectedProvider]?.label || selectedProvider
              }`}
            >
              {(PROVIDER_MODELS[selectedProvider]?.models || []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Persona Selector */}
            <select
              className="behaviour-select"
              value={behaviour}
              onChange={(e) => setBehaviour(e.target.value)}
              title="Select AI Persona"
            >
              <option value="friendly">Friendly</option>
              <option value="developer">Developer</option>
              <option value="serious">Serious</option>
              <option value="sarcastic">Sarcastic</option>
              <option value="sensitive">Sensitive</option>
              <option value="islamic">Islamic</option>
              <option value="poetic">Poetic</option>
            </select>

            {/* Pair Local Device */}
            <button
              className="action-pill-btn"
              onClick={() => setIsPairModalOpen(true)}
              title="Pair Local Desktop Agent (Local-BE)"
            >
              <span className="btn-icon">🔗</span>
              <span className="btn-label">Pair Device</span>
            </button>

            {/* Settings */}
            <button
              className="icon-btn"
              onClick={() => setIsSettingsModalOpen(true)}
              title={`Server Config (${backendUrl})`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            {/* Sync History */}
            <button
              className="icon-btn"
              onClick={() => loadSessionHistory()}
              title="Refresh / Sync Chat History"
              disabled={isFetchingHistory}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isFetchingHistory ? "spin-animation" : ""}
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </button>

            {/* New Chat */}
            <button
              className="icon-btn"
              onClick={createNewSession}
              title="Start New Chat Session"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>

            {/* Status Indicator */}
            <div
              className="status-indicator"
              title={
                isOnline
                  ? `Backend Online (http://localhost:3100)`
                  : `Backend Offline / Unreachable`
              }
            >
              <div
                className={`mini-status ${isOnline ? "online" : "offline"}`}
              />
            </div>

            {/* User Profile Pill */}
            <div className="user-header-pill" onClick={logout} title={`Logged in as ${user?.email || 'User'}\nClick to Log Out`}>
              <div className="user-header-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="user-header-name">
                {user?.name ? user.name.split(" ")[0] : "Logout"}
              </span>
            </div>
          </div>
        </header>

        {/* Message Feed */}
        <div className="chat-feed">
          {chatHistory.length === 0 && !isLoading && (
            <div className="empty-state">
              <div className="empty-logo">✧</div>
              <h3>Nexus Autonomous Assistant</h3>
              <p>
                Ready on <code>{backendUrl}</code>. Execute local desktop commands, take
                screenshots, and interact autonomously.
              </p>
              <div className="quick-suggestions">
                <button
                  className="suggestion-chip"
                  onClick={() =>
                    handleQuickPrompt("Take a screenshot of my screen")
                  }
                >
                  📸 Take a screenshot
                </button>
                <button
                  className="suggestion-chip"
                  onClick={() =>
                    handleQuickPrompt("List the files in my current directory")
                  }
                >
                  📁 List directory files
                </button>
                <button
                  className="suggestion-chip"
                  onClick={() =>
                    handleQuickPrompt("Open VSCode in the current workspace")
                  }
                >
                  💻 Open VS Code
                </button>
                <button
                  className="suggestion-chip"
                  onClick={() =>
                    handleQuickPrompt("What system and OS am I running?")
                  }
                >
                  ⚙️ Check system info
                </button>
              </div>
            </div>
          )}

          {chatHistory.map((msgItem, index) => {
            const key = msgItem.id || `msg-${index}`;
            if (msgItem.role === "user") {
              return <UserBox key={key} message={msgItem.content} />;
            }
            if (msgItem.role === "nexus") {
              return (
                <AIBox
                  key={key}
                  message={msgItem.content?.msg}
                  cmd={msgItem.content?.cmd}
                  terminal={msgItem.content?.terminal}
                  terminalError={msgItem.content?.terminalError}
                  imageBase64={msgItem.content?.imageBase64}
                />
              );
            }
            return null;
          })}

          {isSending && workingOn && (
            <div className="ai-thinking">
              <div className="pulse-ring" />
              <span>{workingOn}</span>
            </div>
          )}

          {isSending && !workingOn && (
            <div className="ai-thinking">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Nexus AI is formulating response...</span>
            </div>
          )}

          {isLoading && chatHistory.length === 0 && (
            <div className="ai-thinking">
              <div className="pulse-ring" />
              <span>Connecting to Nexus Core...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Area */}
        <div className="floating-input-wrapper">
          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder={
                isSending ? "Processing command..." : "Type a message or instruction..."
              }
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
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={isLoading || isSending || !msg.trim()}
              title="Send Message (Enter)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
