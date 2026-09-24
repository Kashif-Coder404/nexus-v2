"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
  Terminal,
  Zap,
} from "lucide-react";
import { ExecutionStep } from "./AIMsgBox";

interface Props {
  executions: ExecutionStep[];
  isWorking?: boolean;
  currentWorkingOn?: string | null;
}

export default function ExecutionSteps({
  executions,
  isWorking = false,
  currentWorkingOn,
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
    <div className="w-full mt-2 rounded-2xl border border-brand-border/40 bg-brand-surface/60 overflow-hidden shadow-lg transition-all">
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
            · {executions.length} steps {isWorking ? "running" : "done"}
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
            const logText = step.terminalOutput || step.terminalError || "";

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
                {isStepOpen && logText && (
                  <div className="px-4 pb-3">
                    <div className="rounded-xl bg-black/90 border border-brand-border/30 p-2.5 font-mono text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-1">
                        <span className="flex items-center gap-1">
                          <Terminal className="h-3 w-3" /> Output
                        </span>
                        <button
                          onClick={() => handleCopy(idx, logText)}
                          className="flex items-center gap-1 hover:text-white cursor-pointer"
                        >
                          {copiedIdx === idx ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedIdx === idx ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <pre className="max-h-48 overflow-y-auto text-zinc-300 whitespace-pre-wrap break-all">
                        {logText}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Current Working Step (Pulsing at the bottom) */}
          {isWorking && currentWorkingOn && (
            <div className="px-4 py-2.5 flex items-center justify-between bg-brand/10">
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
