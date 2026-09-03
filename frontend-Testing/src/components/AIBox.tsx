import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface AIBoxProps {
  message?: any;
  cmd?: string;
  terminal?: string;
  terminalError?: string;
  imageBase64?: string;
}

const AIBox: React.FC<AIBoxProps> = ({
  message,
  cmd,
  terminal,
  terminalError,
  imageBase64,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedStdout, setCopiedStdout] = useState(false);
  const [copiedStderr, setCopiedStderr] = useState(false);

  const displayText =
    typeof message === "string"
      ? message
      : message?.msg || message?.aiMsg || (message ? String(message) : "");

  const parseCommandDetails = (rawCmd?: string) => {
    if (!rawCmd || !rawCmd.trim()) return null;
    try {
      const parsed = typeof rawCmd === "string" ? JSON.parse(rawCmd) : rawCmd;
      if (parsed && typeof parsed === "object" && parsed.action) {
        let label = `Action (${parsed.action})`;
        let display = "";

        switch (parsed.action) {
          case "in_built":
            label = "Terminal / Shell";
            display = parsed.param || "";
            break;
          case "capture_screen":
            label = "Screen Capture";
            display = parsed.param
              ? `capture_screen (${parsed.param})`
              : "Desktop screenshot captured";
            break;
          case "system_info":
            label = "System Diagnostics";
            display = "Querying CPU, RAM, OS and system metrics";
            break;
          case "search":
            label = "File Search";
            display = `search "${parsed.param?.expected_name || ""}" in "${
              parsed.param?.path || "."
            }"`;
            break;
          case "search_app":
            label = "App Search";
            display = `search_app "${parsed.param}"`;
            break;
          case "memory_write":
            label = "Memory Write";
            display = `Save memory [${parsed.param?.category || "general"}]: ${
              parsed.param?.alias
            } = ${parsed.param?.value}`;
            break;
          case "memory_read":
            label = "Memory Read";
            display = `Read memory: ${parsed.param?.alias || ""}`;
            break;
          default:
            label = `Action: ${parsed.action}`;
            display =
              typeof parsed.param === "object"
                ? JSON.stringify(parsed.param, null, 2)
                : String(parsed.param || "");
        }
        return { label, display: display || JSON.stringify(parsed, null, 2) };
      }
    } catch {
      // Plain text
    }
    return { label: "Terminal Command", display: rawCmd };
  };

  const cmdDetails = parseCommandDetails(cmd);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="chat-item ai-item">
      <div className="avatar-wrapper" title="Nexus AI Assistant">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>

      <div className="message-content">
        {imageBase64 && (
          <div className="image-preview">
            <img
              src={
                imageBase64.startsWith("data:")
                  ? imageBase64
                  : `data:image/png;base64,${imageBase64}`
              }
              alt="Nexus Desktop Capture"
            />
          </div>
        )}

        {displayText && (
          <div className="message-text">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code(props: any) {
                  const { children, className } = props;
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? (
                    // @ts-ignore
                    <SyntaxHighlighter
                      PreTag="div"
                      children={String(children).replace(/\n$/, "")}
                      language={match[1]}
                      style={vscDarkPlus}
                    />
                  ) : (
                    <code className={className}>{children}</code>
                  );
                },
              }}
            >
              {displayText}
            </ReactMarkdown>
          </div>
        )}

        {cmdDetails && (
          <div className="code-window">
            <div className="code-header">
              <div className="mac-dots">
                <span className="mac-dot red"></span>
                <span className="mac-dot yellow"></span>
                <span className="mac-dot green"></span>
              </div>
              <span className="window-title">{cmdDetails.label}</span>
              <button
                className="copy-btn"
                onClick={() =>
                  copyToClipboard(cmdDetails.display, setCopiedCmd)
                }
                title="Copy Command"
              >
                {copiedCmd ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="code-body cmd">
              <code>$ {cmdDetails.display}</code>
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
              <span className="window-title stdout-title">stdout</span>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(terminal, setCopiedStdout)}
                title="Copy Stdout"
              >
                {copiedStdout ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="code-body stdout">
              <code>{terminal}</code>
            </pre>
          </div>
        )}

        {terminalError && (
          <div className="code-window error-window">
            <div className="code-header">
              <div className="mac-dots">
                <span className="mac-dot red"></span>
                <span className="mac-dot yellow"></span>
                <span className="mac-dot green"></span>
              </div>
              <span className="window-title stderr-title">stderr</span>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(terminalError, setCopiedStderr)}
                title="Copy Stderr"
              >
                {copiedStderr ? "Copied!" : "Copy"}
              </button>
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

export default AIBox;
