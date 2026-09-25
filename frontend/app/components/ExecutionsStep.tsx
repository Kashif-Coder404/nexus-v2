"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
  Terminal,
} from "lucide-react";
import { ExecutionStep } from "./AIMsgBox";

interface Props {
  executions: ExecutionStep[];
  isWorking?: boolean;
  currentWorkingOn?: string | null;
  workedSeconds?: number;
}
function getCommand(cmd: any): string {
  if (!cmd) return "";
  if (typeof cmd === "string") {
    try {
      const parsed = JSON.parse(cmd);
      if (parsed && typeof parsed === "object") {
        if (parsed.param?.command) return parsed.param.command;
        if (typeof parsed.param === "string") return parsed.param;
        if (parsed.command) return parsed.command;
      }
    } catch {
      // Plain string command (e.g. "dir" or powershell command)
      return cmd;
    }
    return cmd;
  }
  if (typeof cmd === "object") {
    if (cmd.param?.command) return cmd.param.command;
    if (typeof cmd.param === "string") return cmd.param;
    if (cmd.command) return cmd.command;
  }
  return String(cmd);
}
export default function ExecutionSteps({
  executions,
  isWorking = false,
  currentWorkingOn,
  workedSeconds,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedStepIdx, setExpandedStepIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const totalSteps = executions.length + (isWorking ? 1 : 0);
  if (totalSteps === 0) return null;

  const handleCopy = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="w-full mt-2 rounded-2xl overflow-hidden shadow-lg transition-all">
      {/* Header Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-brand-surface/80 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          {isWorking ? (
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          )}
          <span className="text-xs font-semibold text-zinc-200">
            {isWorking ? "Working..." : "Completed"}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            · {executions.length} steps{" "}
            {workedSeconds ? `· ${workedSeconds}s` : ""}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded Step List */}
      {isOpen && (
        <div className="border-t border-brand-border/30 divide-y divide-brand-border/20 text-xs">
          {executions.map((step, idx) => {
            const isStepOpen = expandedStepIdx === idx;
            const logText = [step.terminalOutput, step.terminalError]
              .filter(Boolean)
              .join("\n\n");
            const cwd = step.cwd || "";
            const command = getCommand(step.cmd);
            return (
              <div key={idx} className="space-y-1">
                <button
                  onClick={() => setExpandedStepIdx(isStepOpen ? null : idx)}
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-black/30 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {step.isSuccess !== false ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="font-mono text-zinc-200 truncate">
                      {step.action}
                    </span>
                    {step.msg && (
                      <span className="text-[11px] text-zinc-400 truncate">
                        - {step.msg}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-3 w-3 text-zinc-500 transition-transform ${
                      isStepOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Terminal Output */}
                {isStepOpen && (
                  <div className="px-4 pr-0 space-y-2">
                    {/* 1. Ran Command Box (Always shows if command exists) */}
                    {command && (
                      <div className="rounded-xl bg-black/90 border border-brand-border/30 p-2.5 font-mono text-[11px]">
                        <span>{cwd}&gt; </span>
                        {command}
                      </div>
                    )}

                    {/* 2. Output Box */}
                    {logText ? (
                      <div className="rounded-xl bg-black/90 border border-brand-border/30 p-2.5 font-mono text-[11px]">
                        <pre className="whitespace-pre-wrap">{logText}</pre>
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-500 italic px-2">
                        (Process exited with code 0 and no text output)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Current Working Step (Pulsing at the bottom) */}
          {isWorking && currentWorkingOn && (
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                <span className="font-mono text-brand-glow text-xs animate-pulse">
                  {currentWorkingOn}
                </span>
              </div>
              <span className="text-[10px] font-mono text-brand px-2 py-0.5 rounded-full bg-brand/20">
                Running...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
