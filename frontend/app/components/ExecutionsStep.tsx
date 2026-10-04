"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Terminal,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ExecutionStep } from "./AIMsgBox";
import StepTerminal from "./StepTerminal";

interface Props {
  executions: ExecutionStep[];
  isWorking?: boolean;
  currentWorkingOn?: string | null;
  workedSeconds?: number;
}

function getCommand(cmd: any): string {
  if (!cmd) return "";
  let actualCommand = "";
  if (typeof cmd === "object") {
    const action = cmd.action;
    const param = cmd.param;
    actualCommand += action + " ";
    if (param) {
      if (typeof param === "object") {
        for (const key of Object.keys(param)) {
          actualCommand += `-${key} ${param[key]} `;
        }
      } else {
        actualCommand += param;
      }
    }
    // if (!cmd.param) return cmd.action;
    // if (cmd.param?.command) return cmd.param.command;
    // if (typeof cmd.param === "string") return cmd.param;
    // if (cmd.command) return cmd.command;
    // if (cmd.param) return cmd.param;
  }

  return actualCommand;
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

  const failed = executions.some((step) => step.isSuccess === false);

  const completedCount = executions.filter(
    (step) => step.isSuccess !== false,
  ).length;

  const handleCopy = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);

      setTimeout(() => {
        setCopiedIdx(null);
      }, 1500);
    } catch {}
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-brand-border/45 bg-brand-surface/45">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="
          flex w-full items-center justify-between
          px-3.5 py-3
          text-left
          transition-colors
          hover:bg-brand/5
        "
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Status indicator */}
          {isWorking ? (
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="absolute h-2 w-2 rounded-full bg-brand-hover" />
              <span className="absolute h-3.5 w-3.5 animate-ping rounded-full bg-brand-hover/20" />
            </span>
          ) : failed ? (
            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          )}

          <span
            className={`text-xs font-semibold ${
              isWorking
                ? "text-brand-hover"
                : failed
                  ? "text-red-400"
                  : "text-emerald-400"
            }`}
          >
            {isWorking
              ? "Running"
              : failed
                ? "Completed with errors"
                : "Completed"}
          </span>

          <span className="text-zinc-700">·</span>

          <span className="text-[11px] text-zinc-400">
            {completedCount}/{executions.length} steps
          </span>

          {workedSeconds !== undefined && workedSeconds > 0 && (
            <>
              <span className="text-zinc-700">·</span>

              <span className="font-mono text-[11px] text-zinc-400">
                {workedSeconds}s
              </span>
            </>
          )}
        </div>

        <ChevronDown
          className={`
            h-3.5 w-3.5
            text-zinc-500
            transition-transform
            duration-200
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-brand-border/30">
              <div className="px-3 py-1.5">
                {executions.map((step, idx) => {
                  const isExpanded = expandedStepIdx === idx;

                  const isSuccess = step.isSuccess !== false;

                  const action =
                    (step.cmd as any)?.action || step.action || "command";

                  const command = getCommand(step.cmd);

                  const output = [step.terminalOutput, step.terminalError]
                    .filter(Boolean)
                    .join("\n\n");

                  const cwd = step.cwd || "";

                  return (
                    <div key={idx} className="relative">
                      {/* Vertical timeline */}
                      {idx < executions.length - 1 && (
                        <div className="absolute left-[7px] top-6 bottom-0 w-px bg-brand-border/35" />
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedStepIdx(isExpanded ? null : idx)
                        }
                        className="
                          group
                          relative
                          flex
                          w-full
                          items-center
                          gap-2.5
                          rounded-md
                          px-1
                          py-2
                          text-left
                          transition-colors
                          hover:bg-brand/5
                        "
                      >
                        {/* Step status */}
                        <div className="relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center bg-brand-surface">
                          {isSuccess ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                          )}
                        </div>

                        {/* Main content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-mono text-xs font-medium text-zinc-200">
                              {action}
                            </span>

                            {step.msg && (
                              <>
                                <span className="text-zinc-700">—</span>

                                <span className="truncate text-xs text-zinc-400">
                                  {step.msg}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Command preview */}
                          {command && !isExpanded && (
                            <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                              <span className="font-mono text-[10px] text-zinc-600">
                                ↳
                              </span>

                              <span className="truncate font-mono text-[11px] text-zinc-400">
                                {command}
                              </span>
                            </div>
                          )}
                        </div>

                        <ChevronDown
                          className={`
                            h-3.5 w-3.5 shrink-0
                            text-zinc-600
                            transition-transform
                            group-hover:text-zinc-400
                            ${isExpanded ? "rotate-180" : ""}
                          `}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              height: 0,
                            }}
                            animate={{
                              opacity: 1,
                              height: "auto",
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                            }}
                            transition={{
                              duration: 0.16,
                            }}
                            className="overflow-hidden"
                          >
                            <div className="ml-[24px] space-y-2 pb-2.5">
                              {/* Command */}
                              {command && (
                                <div className="overflow-hidden rounded-lg border border-brand-border/30 bg-black/25">
                                  <div className="flex items-center gap-1.5 border-b border-brand-border/20 px-2.5 py-1.5">
                                    <Terminal className="h-3.5 w-3.5 text-zinc-500" />

                                    <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                                      Command
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto px-2.5 py-2">
                                    <code className="whitespace-pre font-mono text-[11px] text-zinc-300">
                                      {cwd && (
                                        <span className="text-zinc-500">
                                          {cwd}
                                          {" > "}
                                        </span>
                                      )}

                                      {command}
                                    </code>
                                  </div>
                                </div>
                              )}

                              {/* Terminal output */}
                              {output ? (
                                <div className="overflow-hidden rounded-lg border border-brand-border/30 bg-black/25">
                                  <div className="flex items-center justify-between border-b border-brand-border/20 px-2.5 py-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />

                                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                                        Output
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(idx, output);
                                      }}
                                      className="
                                        rounded
                                        p-1
                                        text-zinc-500
                                        transition-colors
                                        hover:bg-brand/10
                                        hover:text-zinc-200
                                      "
                                      title="Copy output"
                                    >
                                      {copiedIdx === idx ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>

                                  <StepTerminal terminalOutput={output} />
                                </div>
                              ) : (
                                <div className="px-2 text-[10px] italic text-zinc-500">
                                  Process completed without output.
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {isWorking && currentWorkingOn && (
                  <div className="relative mt-0.5">
                    {/* Timeline continuation */}
                    {executions.length > 0 && (
                      <div className="absolute left-[7px] top-0 bottom-0 w-px bg-brand-border/35" />
                    )}

                    <div
                      className="
                        relative
                        flex
                        items-center
                        gap-2.5
                        rounded-lg
                        border
                        border-brand-border/45
                        bg-brand/5
                        px-2
                        py-2
                      "
                    >
                      {/* Active indicator */}
                      <div className="relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center bg-brand-surface">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-hover" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-xs font-medium text-zinc-200">
                          {currentWorkingOn}
                        </div>

                        <div className="mt-0.5 text-[10px] text-zinc-400">
                          In progress
                        </div>
                      </div>

                      <span
                        className="
                          shrink-0
                          rounded-md
                          border
                          border-brand-border/40
                          bg-brand-surface
                          px-2
                          py-0.5
                          font-mono
                          text-[11px]
                          text-zinc-400
                        "
                      >
                        {workedSeconds ?? 0}s
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {isWorking && (
                <div className="flex items-center gap-2 border-t border-brand-border/25 px-3.5 py-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-hover" />

                  <span className="text-[10px] text-zinc-400">
                    Nexus is executing the requested task
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
