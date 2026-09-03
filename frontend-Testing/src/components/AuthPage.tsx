import React, { useState } from "react";
import { useAppContext } from "../context/provider";

const AuthPage: React.FC = () => {
  const {
    login,
    signup,
    guestLogin,
    backendUrl,
    updateBackendUrl,
    refreshHealth,
    isOnline,
  } = useAppContext();

  const [authMode, setAuthMode] = useState<"login" | "signup" | "guest">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [customKey, setCustomKey] = useState("MyCurrentAPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Backend URL editor toggle
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [urlInput, setUrlInput] = useState(backendUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (authMode === "login") {
        await login(email, password);
      } else if (authMode === "signup") {
        await signup(name, email, password);
      } else if (authMode === "guest") {
        guestLogin(customKey.trim() || undefined);
      }
    } catch (err: any) {
      console.error("[Auth Error]", err);
      setErrorMsg(
        err.message ||
          "Authentication failed. Make sure the backend server is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    updateBackendUrl(urlInput.trim());
    setShowServerConfig(false);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo">✧</div>
          <h2>Nexus Autonomous AI</h2>
          <p className="auth-subtitle">
            Next-generation autonomous system management & agentic computing
          </p>

          <div className="server-status-pill">
            <span
              className={`server-status-dot ${
                isOnline ? "online" : "offline"
              }`}
            />
            <span className="server-status-text">
              Backend: <code>{backendUrl}</code>
            </span>
            <button
              type="button"
              className="server-edit-btn"
              onClick={() => setShowServerConfig(!showServerConfig)}
              title="Edit Backend URL"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Server Config Collapsible */}
        {showServerConfig && (
          <form onSubmit={handleSaveUrl} className="auth-server-form">
            <div className="input-group">
              <label>Backend Server URL</label>
              <div className="url-input-row">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="http://localhost:3100"
                  className="modal-text-input"
                />
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
              <div className="preset-buttons" style={{ marginTop: "6px" }}>
                <button
                  type="button"
                  className="preset-pill"
                  onClick={() => setUrlInput("http://localhost:3100")}
                >
                  Localhost (3100)
                </button>
                <button
                  type="button"
                  className="preset-pill"
                  onClick={() => refreshHealth()}
                >
                  Test Ping
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Auth Mode Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${authMode === "login" ? "active" : ""}`}
            onClick={() => {
              setAuthMode("login");
              setErrorMsg(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
            onClick={() => {
              setAuthMode("signup");
              setErrorMsg(null);
            }}
          >
            Create Account
          </button>
          <button
            type="button"
            className={`auth-tab ${authMode === "guest" ? "active" : ""}`}
            onClick={() => {
              setAuthMode("guest");
              setErrorMsg(null);
            }}
          >
            Guest / API Key
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="auth-alert error">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="auth-form">
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

          {authMode !== "guest" ? (
            <>
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
            </>
          ) : (
            <div className="input-group">
              <label>Nexus API Key / JWT Token</label>
              <input
                type="text"
                placeholder="MyCurrentAPI"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="modal-text-input"
              />
              <small className="help-text">
                Quickly bypass database user login and connect directly using
                the server API authentication key.
              </small>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Connecting..."
              : authMode === "login"
              ? "Sign In to Workspace"
              : authMode === "signup"
              ? "Create & Initialize Account"
              : "Continue as Guest"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
