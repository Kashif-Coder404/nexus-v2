import React from "react";

interface AIBoxProps {
  message?: any;
  cmd?: string;
  terminal?: string;
  terminalError?: string;
}

const AIBOX: React.FC<AIBoxProps> = ({ message, cmd, terminal, terminalError }) => {
  const displayText =
    typeof message === "string"
      ? message
      : message?.msg || message?.aiMsg || (message ? String(message) : "");

  return (
    <div className="chat-item ai-item">
      <div className="avatar-wrapper">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
      </div>
      
      <div className="message-content">
        {displayText && <div className="message-text">{displayText}</div>}

        {cmd && (
          <div className="code-window">
            <div className="code-header">
              <div className="mac-dots">
                <span className="mac-dot red"></span>
                <span className="mac-dot yellow"></span>
                <span className="mac-dot green"></span>
              </div>
              <span>bash</span>
            </div>
            <pre className="code-body cmd">
              <code>$ {cmd}</code>
            </pre>
          </div>
        )}

        {terminal && (
          <div className="code-window">
            <div className="code-header">
              <div className="mac-dots">
                <span className="mac-dot red"></span>
                <span className="mac-dot yellow"></span>
                <span className="mac-dot green"></span>
              </div>
              <span>stdout</span>
            </div>
            <pre className="code-body stdout">
              <code>{terminal}</code>
            </pre>
          </div>
        )}

        {terminalError && (
          <div className="code-window">
            <div className="code-header">
              <div className="mac-dots">
                <span className="mac-dot red"></span>
                <span className="mac-dot yellow"></span>
                <span className="mac-dot green"></span>
              </div>
              <span style={{ color: '#f87171' }}>stderr</span>
            </div>
            <pre className="code-body stderr">
              <code>{terminalError}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIBOX;
