import React from "react";
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

const AIBOX: React.FC<AIBoxProps> = ({
  message,
  cmd,
  terminal,
  terminalError,
  imageBase64,
}) => {
  const displayText =
    typeof message === "string"
      ? message
      : message?.msg || message?.aiMsg || (message ? String(message) : "");

  return (
    <div className="chat-item ai-item">
      <div className="avatar-wrapper">
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
              src={imageBase64}
              alt="Nexus AI Captured Image"
            />
          </div>
        )}
        {displayText && (
          <div className="message-text">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code(props) {
                  const { children, className, node, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? (
                    <SyntaxHighlighter
                      {...rest}
                      PreTag="div"
                      children={String(children).replace(/\n$/, "")}
                      language={match[1]}
                      style={vscDarkPlus}
                    />
                  ) : (
                    <code {...rest} className={className}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {displayText}
            </ReactMarkdown>
          </div>
        )}

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
              <span style={{ color: "#f87171" }}>stderr</span>
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
