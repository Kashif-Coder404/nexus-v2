"use client";
import React, { useState } from "react";
import {
  Bot,
  Terminal,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Sparkles,
  ImageIcon,
} from "lucide-react";

interface ExecutionStep {
  steps?: number;
  action?: string;
  cmd?: string;
  msg?: string;
  exitCode?: string;
  isSuccess?: boolean;
  terminalOutput?: string;
  terminalError?: string;
}

interface AIMsgProps {
  data: any;
  timestamp?: string;
}

const AIMsg: React.FC<AIMsgProps> = ({ data, timestamp }) => {
  const [showExecutions, setShowExecutions] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedTerminal, setCopiedTerminal] = useState(false);

  // Extract fields whether data is full response or nested payload
  const aiData = data?.data || data || {};
  const mainMessage: string =
    aiData?.lastAIMsg ||
    aiData?.message ||
    data?.message ||
    (typeof data === "string" ? data : "") ||
    "Nexus processed your request.";

  const executions: ExecutionStep[] = Array.isArray(aiData?.executions)
    ? aiData.executions
    : [];

  const rawTerminal = aiData?.terminal || "";
  const terminalError = aiData?.terminalError || "";
  const imageBase64 = aiData?.imageBase64 || "";

  // Helper to extract clean shell command from json if needed
  const getDisplayCommand = (cmdStr?: string) => {
    if (!cmdStr) return "";
    try {
      const parsed = JSON.parse(cmdStr);
      return typeof parsed?.param === "string"
        ? parsed.param
        : JSON.stringify(parsed?.param || parsed);
    } catch {
      return cmdStr;
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyTerminal = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTerminal(true);
    setTimeout(() => setCopiedTerminal(false), 2000);
  };

  return (
    <div className="flex w-full justify-start my-4">
      <div className="flex max-w-[92%] sm:max-w-[85%] items-start gap-3">
        {/* Glowing Nexus Bot Avatar */}
        <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-linear-to-r from-purple-700 via-purple-600 to-indigo-800 text-white shadow-lg shadow-purple-900/50 border border-purple-400/40 relative group">
          <Bot className="h-5 w-5 animate-pulse text-purple-200" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        {/* Message Card Container */}
        <div className="flex flex-col gap-3 w-full">
          {/* Header Bar */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-white flex items-center gap-1.5">
              Nexus AI
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-300">
              Desktop Agent
            </span>
            {timestamp && (
              <span className="text-[11px] text-zinc-400 ml-auto">
                {timestamp}
              </span>
            )}
          </div>

          {/* Main Response Box */}
          <div className="rounded-2xl rounded-tl-sm bg-zinc-900/80 border border-purple-500/20 p-4 shadow-xl backdrop-blur-md">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200 font-normal">
              {mainMessage}
            </p>

            {/* Execution Steps Accordion */}
            {executions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-purple-500/20">
                <button
                  onClick={() => setShowExecutions(!showExecutions)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-purple-300 hover:text-purple-200 transition py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-purple-400" />
                    Agent Executions ({executions.length}{" "}
                    {executions.length === 1 ? "step" : "steps"})
                  </span>
                  {showExecutions ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showExecutions && (
                  <div className="mt-2 space-y-2.5">
                    {executions.map((step, idx) => {
                      const displayCmd = getDisplayCommand(step.cmd);
                      return (
                        <div
                          key={idx}
                          className="rounded-xl bg-zinc-950/80 border border-purple-500/20 p-3 text-xs space-y-2"
                        >
                          {/* Step Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-purple-950 px-2 py-0.5 text-[11px] font-semibold text-purple-300 border border-purple-500/30">
                                Step {step.steps || idx + 1}
                              </span>
                              <span className="text-zinc-400 font-mono text-[11px]">
                                {step.action || "action"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {step.isSuccess ? (
                                <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Success
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-rose-400 text-[11px] font-medium bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-500/30">
                                  <XCircle className="h-3 w-3" />
                                  Failed
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Step Explanation */}
                          {step.msg && (
                            <p className="text-zinc-300 text-xs italic">
                              "{step.msg}"
                            </p>
                          )}

                          {/* Executed Command */}
                          {displayCmd && (
                            <div className="flex items-center justify-between rounded-lg bg-black/60 px-3 py-2 font-mono text-zinc-300 border border-zinc-800">
                              <div className="flex items-center gap-2 overflow-x-auto">
                                <span className="text-purple-400 select-none">
                                  $
                                </span>
                                <code>{displayCmd}</code>
                              </div>
                              <button
                                onClick={() => handleCopy(displayCmd, idx)}
                                className="text-zinc-400 hover:text-white transition ml-2 shrink-0 p-1"
                                title="Copy command"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}

                          {/* Step Output */}
                          {step.terminalOutput && (
                            <div className="rounded-lg bg-black/40 px-3 py-1.5 font-mono text-[11px] text-zinc-400 overflow-x-auto">
                              <span className="text-zinc-500 select-none">
                                output:{" "}
                              </span>
                              <span>{step.terminalOutput.trim()}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Global Terminal Logs Section */}
            {(rawTerminal || terminalError) && (
              <div className="mt-3 pt-3 border-t border-purple-500/20">
                <button
                  onClick={() => setShowTerminal(!showTerminal)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    Terminal Console
                  </span>
                  {showTerminal ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showTerminal && (
                  <div className="mt-2 rounded-xl bg-black border border-zinc-800 overflow-hidden shadow-2xl">
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80 inline-block" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80 inline-block" />
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500/80 inline-block" />
                        <span className="text-[11px] font-mono text-zinc-400 ml-2">
                          bash
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleCopyTerminal(rawTerminal || terminalError)
                        }
                        className="text-zinc-400 hover:text-white transition p-1"
                        title="Copy logs"
                      >
                        {copiedTerminal ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Terminal Body */}
                    <div className="p-3 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
                      {rawTerminal && (
                        <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                          {rawTerminal}
                        </pre>
                      )}
                      {terminalError && (
                        <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed">
                          {terminalError}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Screenshot Preview */}
            {imageBase64 && (
              <div className="mt-3 pt-3 border-t border-purple-500/20">
                <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold mb-2">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Captured Screen
                </div>
                <div className="rounded-xl overflow-hidden border border-purple-500/30 max-w-md shadow-lg">
                  <img
                    src={`data:image/png;base64,${imageBase64}`}
                    alt="Captured Screenshot"
                    className="w-full h-auto object-cover hover:scale-105 transition duration-300 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMsg;
