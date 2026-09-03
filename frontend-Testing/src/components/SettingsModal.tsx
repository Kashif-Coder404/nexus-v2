import React, { useState } from "react";
import { useChat } from "../hooks/useChat";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    backendUrl,
    updateBackendUrl,
    token,
    user,
    setCustomToken,
    login,
    signup,
    logout,
    refreshHealth,
    isOnline,
  } = useChat();

  const [activeTab, setActiveTab] = useState<"server" | "auth" | "token">(
    "server"
  );

  // Server state
  const [urlInput, setUrlInput] = useState(backendUrl);

  // Auth state
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rawTokenInput, setRawTokenInput] = useState(token);

  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    updateBackendUrl(urlInput.trim());
    setStatusMsg({
      type: "success",
      text: `Backend URL updated to ${urlInput.trim()}`,
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      if (authMode === "login") {
        await login(email, password);
        setStatusMsg({ type: "success", text: "Logged in successfully!" });
      } else {
        await signup(name, email, password);
        setStatusMsg({ type: "success", text: "Signed up and logged in!" });
      }
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Authentication failed.",
      });
    }
  };

  const handleSaveRawToken = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomToken(rawTokenInput);
    setStatusMsg({ type: "success", text: "JWT Token saved successfully." });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">⚙️</span>
            <h3>Backend & Authentication Settings</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === "server" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("server");
              setStatusMsg(null);
            }}
          >
            Server URL
          </button>
          <button
            className={`modal-tab ${activeTab === "auth" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("auth");
              setStatusMsg(null);
            }}
          >
            User Login / Signup
          </button>
          <button
            className={`modal-tab ${activeTab === "token" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("token");
              setStatusMsg(null);
            }}
          >
            Direct JWT Token
          </button>
        </div>

        {statusMsg && (
          <div className={`modal-status ${statusMsg.type}`}>
            {statusMsg.text}
          </div>
        )}

        {/* TAB 1: Server URL */}
        {activeTab === "server" && (
          <form onSubmit={handleSaveUrl} className="modal-form">
            <div className="input-group">
              <label>Cloud / Main Backend URL</label>
              <input
                type="text"
                placeholder="http://localhost:3100"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="modal-text-input"
              />
              <small className="help-text">
                Current Status:{" "}
                <span
                  style={{
                    color: isOnline ? "#10b981" : "#ef4444",
                    fontWeight: 600,
                  }}
                >
                  {isOnline ? "Online (200 OK)" : "Offline / Unreachable"}
                </span>
              </small>
            </div>

            <div className="preset-buttons">
              <button
                type="button"
                className="preset-pill"
                onClick={() => setUrlInput("http://localhost:3100")}
              >
                Localhost (http://localhost:3100)
              </button>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => refreshHealth()}
              >
                Test Ping
              </button>
              <button type="submit" className="btn btn-primary">
                Save URL
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: User Login & Signup */}
        {activeTab === "auth" && (
          <div className="modal-form">
            {user ? (
              <div className="user-profile-card">
                <div className="user-info">
                  <div className="user-avatar-circle">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h4>{user.name || "Authenticated User"}</h4>
                    <p>{user.email || "nexus-user"}</p>
                    {user._id && (
                      <small style={{ color: "var(--color-text-muted)" }}>
                        User ID: {user._id}
                      </small>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={logout}
                  style={{ marginTop: "1rem", width: "100%" }}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit}>
                <div className="sub-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${
                      authMode === "login" ? "active" : ""
                    }`}
                    onClick={() => setAuthMode("login")}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${
                      authMode === "signup" ? "active" : ""
                    }`}
                    onClick={() => setAuthMode("signup")}
                  >
                    Sign Up
                  </button>
                </div>

                {authMode === "signup" && (
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="modal-text-input"
                      required
                    />
                  </div>
                )}

                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="modal-text-input"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="modal-text-input"
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary">
                    {authMode === "login" ? "Log In" : "Sign Up & Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: Direct Raw JWT */}
        {activeTab === "token" && (
          <form onSubmit={handleSaveRawToken} className="modal-form">
            <div className="input-group">
              <label>Custom JWT / Bearer Token</label>
              <textarea
                placeholder="Paste your JWT token or API key here..."
                value={rawTokenInput}
                onChange={(e) => setRawTokenInput(e.target.value)}
                className="modal-textarea"
                rows={4}
              />
              <small className="help-text">
                Sent as <code>Authorization: Bearer &lt;token&gt;</code> on all
                Nexus API and chat requests.
              </small>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setRawTokenInput("MyCurrentAPI");
                  setCustomToken("MyCurrentAPI");
                }}
              >
                Reset Default
              </button>
              <button type="submit" className="btn btn-primary">
                Apply Token
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
