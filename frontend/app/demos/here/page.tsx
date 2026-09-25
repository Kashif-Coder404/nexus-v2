"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Play,
  Square,
  RefreshCw,
  Cpu,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ArrowRight,
  Layers,
  Trash2,
  Send,
  Bot,
  User as UserIcon,
  ChevronDown,
  Copy,
  Check,
  Server,
  StopCircle,
  Sliders,
} from "lucide-react";

interface ExecutionStep {
  steps: number;
  action: string;
  cmd: string;
  msg: string;
  isSuccess: boolean;
  terminalOutput?: string;
  duration?: string;
  cwd?: string;
  pid?: number;
  isBackground?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  executions?: ExecutionStep[];
  isReactiveWakeup?: boolean;
  status?: "in_progress" | "completed" | "failed";
  workedTime?: string;
  remainingTasks?: string[];
}

interface ActiveTask {
  id: string;
  pid: number;
  command: string;
  cwd: string;
  status: "running" | "completed" | "killed";
  startTime: number;
  logs: string[];
  isDaemon: boolean;
}

// ----------------------------------------------------------------------------
// ExecutionStepsWrapper: Collapsible wrapper titled "Worked for {time}"
// with individual step sub-headers and clean command/output terminal boxes
// ----------------------------------------------------------------------------
function ExecutionStepsWrapper({
  executions,
  workedTime,
  isWorking = false,
}: {
  executions: ExecutionStep[];
  workedTime?: string;
  isWorking?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedStepIdx, setExpandedStepIdx] = useState<number | null>(null);
  const [copiedCmdIdx, setCopiedCmdIdx] = useState<number | null>(null);
  const [copiedOutputIdx, setCopiedOutputIdx] = useState<number | null>(null);

  if (!executions || executions.length === 0) return null;

  const handleCopyCmd = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmdIdx(idx);
    setTimeout(() => setCopiedCmdIdx(null), 1500);
  };

  const handleCopyOutput = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOutputIdx(idx);
    setTimeout(() => setCopiedOutputIdx(null), 1500);
  };

  const titleText = isWorking
    ? `Working... ${workedTime ? `(${workedTime})` : ""}`
    : `Worked for ${workedTime || "few seconds"}`;

  return (
    <div className="w-full mt-2 rounded-2xl overflow-hidden border border-[#4c227b]/40 bg-[#0d091a]/95 shadow-xl">
      {/* 1. Wrapper Header Button with 'Worked for {time}' */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#1a122e]/80 transition-colors cursor-pointer select-none text-left"
      >
        <div className="flex items-center gap-2.5">
          {isWorking ? (
            <Clock className="h-4 w-4 text-purple-400 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          )}
          <span className="text-xs font-semibold text-zinc-200">
            {titleText}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full">
            {executions.length} {executions.length === 1 ? "step" : "steps"}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 2. Expanded Individual Step List */}
      {isOpen && (
        <div className="border-t border-[#4c227b]/30 divide-y divide-[#4c227b]/20 text-xs">
          {executions.map((step, idx) => {
            const isStepOpen =
              expandedStepIdx === null || expandedStepIdx === idx;
            const logText = step.terminalOutput || "";
            return (
              <div key={idx} className="bg-black/30">
                {/* Step Sub-Header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedStepIdx(
                      expandedStepIdx === idx ? -1 : idx
                    )
                  }
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-black/50 cursor-pointer text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {step.isBackground ? (
                      <Clock className="h-3.5 w-3.5 text-purple-400 animate-spin shrink-0" />
                    ) : step.isSuccess !== false ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="font-mono text-xs text-purple-300 font-semibold truncate">
                      Step {step.steps}: {step.action}
                    </span>
                    {step.msg && (
                      <span className="text-[11px] text-zinc-400 truncate hidden sm:inline">
                        — {step.msg}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {step.duration && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {step.duration}
                      </span>
                    )}
                    {step.pid && (
                      <span className="text-[10px] text-purple-300 font-mono bg-purple-900/50 border border-purple-700/40 px-1.5 py-0.5 rounded">
                        PID: {step.pid}
                      </span>
                    )}
                    <ChevronDown
                      className={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${
                        isStepOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Step Command & Output Blocks */}
                {isStepOpen && (
                  <div className="p-3 pt-1 space-y-2 font-mono text-[11px]">
                    {/* Ran Command Box */}
                    {step.cmd && (
                      <div className="rounded-xl bg-black/90 border border-purple-900/40 p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-800 pb-1">
                          <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
                            <Terminal className="h-3 w-3 text-purple-400" />
                            Ran command
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCmd(idx, step.cmd)}
                            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-zinc-400"
                          >
                            {copiedCmdIdx === idx ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copiedCmdIdx === idx ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <pre className="text-zinc-300 whitespace-pre-wrap break-all text-[11px]">
                          {step.cwd && (
                            <span className="text-zinc-500 font-mono">
                              {step.cwd}&gt;{" "}
                            </span>
                          )}
                          <span className="text-purple-200">{step.cmd}</span>
                        </pre>
                      </div>
                    )}

                    {/* Output Box */}
                    {logText && (
                      <div className="rounded-xl bg-black/90 border border-[#4c227b]/40 p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-800 pb-1">
                          <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                            <Terminal className="h-3 w-3 text-emerald-400" />
                            Output
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyOutput(idx, logText)}
                            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-zinc-400"
                          >
                            {copiedOutputIdx === idx ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copiedOutputIdx === idx ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <pre className="max-h-56 overflow-y-auto text-zinc-300 whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                          {logText}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DemoSandboxPage() {
  // Config
  const [thresholdMs, setThresholdMs] = useState<number>(1500);
  const [activePathHighlight, setActivePathHighlight] = useState<
    "idle" | "path1" | "path2" | "path3" | "wakeup"
  >("idle");

  // State
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to the **Nexus 3-Path Engine Sandbox**! Test fast commands (< 1500ms), long finite tasks with automatic reactive wakeups, and infinite daemons without burning any AI tokens.",
      timestamp: "12:00 PM",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [currentWorkingOn, setCurrentWorkingOn] = useState<string | null>(null);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [liveSeconds, setLiveSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeIntervalsRef = useRef<{ [taskId: string]: NodeJS.Timeout }>({});

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isWorking]);

  // Live timer for currently working inline task
  useEffect(() => {
    if (!isWorking) {
      setLiveSeconds(0);
      return;
    }
    setLiveSeconds(1);
    const t = setInterval(() => setLiveSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isWorking]);

  // Clean up daemon intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(activeIntervalsRef.current).forEach((i) => clearInterval(i));
    };
  }, []);

  // --------------------------------------------------------------------------
  // The 3-Path Execution Engine Simulator
  // --------------------------------------------------------------------------
  const executeSimulation = (
    commandText: string,
    simulatedDurationMs: number,
    isDaemon: boolean,
    customLogs: string[]
  ) => {
    if (isWorking) return;

    const userMsgId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: `Run command: \`${commandText}\``,
      timestamp: timeStr,
    };
    setChat((prev) => [...prev, userMsg]);
    setIsWorking(true);
    setCurrentWorkingOn(`Executing "${commandText}"`);

    const startTime = Date.now();
    const pid = Math.floor(10000 + Math.random() * 90000);
    const taskId = `task-${pid}`;
    const cwd = "D:\\Coding\\PROJECTS\\Next\\Nexus_v2";

    // -------------------------------------------------------------
    // PATH 1: Fast Command (< thresholdMs)
    // -------------------------------------------------------------
    if (simulatedDurationMs <= thresholdMs && !isDaemon) {
      setActivePathHighlight("path1");
      setTimeout(() => {
        setIsWorking(false);
        setCurrentWorkingOn(null);

        const durationStr = (simulatedDurationMs / 1000).toFixed(1) + "s";
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          status: "completed",
          workedTime: durationStr,
          remainingTasks: [],
          content: `Command executed successfully within threshold (${durationStr}).`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          executions: [
            {
              steps: 1,
              action: "in_built",
              cmd: commandText,
              msg: "Process completed cleanly",
              isSuccess: true,
              duration: durationStr,
              cwd,
              terminalOutput: customLogs.join("\n"),
            },
          ],
        };
        setChat((prev) => [...prev, assistantMsg]);
        setTimeout(() => setActivePathHighlight("idle"), 2500);
      }, simulatedDurationMs);

      return;
    }

    // -------------------------------------------------------------
    // Threshold Exceeded -> Register as Background Task!
    // -------------------------------------------------------------
    setTimeout(() => {
      // Free the chat!
      setIsWorking(false);
      setCurrentWorkingOn(null);

      if (isDaemon) {
        setActivePathHighlight("path3");
      } else {
        setActivePathHighlight("path2");
      }

      // Create Unified Assistant Message for this Turn
      const assistantMsgId = `asst-${Date.now()}`;
      const promotedMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        status: "in_progress",
        workedTime: `${(thresholdMs / 1000).toFixed(1)}s (running)`,
        remainingTasks: isDaemon
          ? ["Verify port 3000 listening signal & server readiness"]
          : ["Step 2: Validate standalone bundle (Test-Path .next/standalone)"],
        content: isDaemon
          ? `I spawned \`${commandText}\` (PID: \`${pid}\`). Verifying port binding & readiness...`
          : `I started \`${commandText}\` in the background (PID: \`${pid}\`). You can continue chatting while I monitor it; once done, I will automatically execute the remaining verification steps.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        executions: [
          {
            steps: 1,
            action: "in_built",
            cmd: commandText,
            msg: `Running in Background (PID: ${pid})...`,
            isSuccess: true,
            duration: "in progress...",
            cwd,
            pid,
            isBackground: true,
            terminalOutput: `[Nexus Agent] Process running detached in background.\nPID: ${pid}\nTask ID: ${taskId}`,
          },
        ],
      };
      setChat((prev) => [...prev, promotedMsg]);

      // Create Task Entry in Tasks Drawer
      const newTask: ActiveTask = {
        id: taskId,
        pid,
        command: commandText,
        cwd,
        status: "running",
        startTime,
        logs: [`[${new Date().toLocaleTimeString()}] Process spawned with PID ${pid}`],
        isDaemon,
      };
      setActiveTasks((prev) => [newTask, ...prev]);

      // Stream logs chunk by chunk
      let logIndex = 0;
      let isVerified = false;

      const logInterval = setInterval(() => {
        if (logIndex < customLogs.length) {
          const line = customLogs[logIndex];
          setActiveTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    logs: [
                      ...t.logs,
                      `[${new Date().toLocaleTimeString()}] ${line}`,
                    ],
                  }
                : t
            )
          );

          // -------------------------------------------------------------
          // DAEMON READINESS DETECTION: Update the SAME message in-place!
          // -------------------------------------------------------------
          if (isDaemon && !isVerified) {
            // Check for crash
            if (line.includes("EADDRINUSE") || line.includes("Error:") || line.includes("failed")) {
              isVerified = true;
              clearInterval(logInterval);
              delete activeIntervalsRef.current[taskId];

              setActiveTasks((prev) =>
                prev.map((t) =>
                  t.id === taskId ? { ...t, status: "killed" } : t
                )
              );

              // Update the original message in-place!
              setChat((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        status: "failed",
                        workedTime: "failed at 1.4s",
                        remainingTasks: [],
                        content: `❌ **Server Startup FAILED!** (PID: \`${pid}\`)\n\n- **Error**: \`${line}\`\n- **Diagnosis**: Port conflict detected. The server crashed immediately and could not bind.\n\nProcess was terminated to prevent zombie process.`,
                        executions: [
                          {
                            steps: 1,
                            action: "in_built",
                            cmd: commandText,
                            msg: "Process crashed on boot (Port in use)",
                            isSuccess: false,
                            duration: "failed",
                            cwd,
                            pid,
                            isBackground: false,
                            terminalOutput: `[Crash]\n${line}`,
                          },
                        ],
                      }
                    : msg
                )
              );
              return;
            }

            // Check for success (e.g. "Ready on http", "Listening on")
            if (
              line.includes("http://localhost") ||
              line.includes("Listening on") ||
              line.includes("Ready")
            ) {
              isVerified = true;
              const portMatch = line.match(/:(\d{3,5})/);
              const detectedPort = portMatch ? portMatch[1] : "3000";

              // Update the original message in-place!
              setChat((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        status: "completed",
                        workedTime: "1.4s",
                        remainingTasks: [],
                        content: `🚀 **Server Successfully Started & Verified!**\n\n- **Service**: \`${commandText}\`\n- **Local URL**: [http://localhost:${detectedPort}](http://localhost:${detectedPort})\n- **Listening Port**: \`${detectedPort}\`\n- **Process PID**: \`${pid}\`\n- **Verification Signal**: Confirmed via output \`${line}\`\n\nThe server is **confirmed alive and listening**. It is running in the background Tasks node.`,
                        executions: [
                          {
                            steps: 1,
                            action: "in_built",
                            cmd: commandText,
                            msg: `Verified Active (Port ${detectedPort}, PID ${pid})`,
                            isSuccess: true,
                            duration: "1.4s",
                            cwd,
                            pid,
                            isBackground: true,
                            terminalOutput: customLogs.slice(0, logIndex + 1).join("\n"),
                          },
                        ],
                      }
                    : msg
                )
              );
            }
          }

          logIndex++;
        } else if (isDaemon) {
          // If infinite daemon, keep ticking simulated ping logs
          setActiveTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    logs: [
                      ...t.logs,
                      `[${new Date().toLocaleTimeString()}] [PID ${pid}] Live heart-beat: server active (port: 3000)...`,
                    ],
                  }
                : t
            )
          );
        }
      }, 700);

      activeIntervalsRef.current[taskId] = logInterval;

      // -------------------------------------------------------------
      // PATH 2 (Finite Task Completion: Update SAME message + execute Step 2!)
      // -------------------------------------------------------------
      if (!isDaemon) {
        const remainingTime = Math.max(100, simulatedDurationMs - thresholdMs);
        setTimeout(() => {
          clearInterval(activeIntervalsRef.current[taskId]);
          delete activeIntervalsRef.current[taskId];

          // Mark task completed in drawer
          setActiveTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, status: "completed" } : t
            )
          );

          // AI Wakes Up to Execute Step 2
          setActivePathHighlight("wakeup");
          setIsWorking(true);
          setCurrentWorkingOn(
            `⚡ Task finished — AI executing Step 2 (Validating build artifacts)...`
          );

          // Simulated execution of remaining step (Step 2)
          setTimeout(() => {
            setIsWorking(false);
            setCurrentWorkingOn(null);

            const totalDurationStr = (simulatedDurationMs / 1000).toFixed(1) + "s";

            // Update the SAME assistant message in-place with all completed steps!
            setChat((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      status: "completed",
                      workedTime: totalDurationStr,
                      remainingTasks: [],
                      content: `✅ **Build & Validation Completed Successfully!**\n\nI monitored background task **\`${commandText}\`** (PID: \`${pid}\`) until exit code 0. Once done, I automatically performed **Step 2** to verify the standalone production output.\n\nEverything is validated and ready to deploy!`,
                      executions: [
                        {
                          steps: 1,
                          action: "in_built",
                          cmd: commandText,
                          msg: "Build process exited with code 0",
                          isSuccess: true,
                          duration: totalDurationStr,
                          cwd,
                          pid,
                          isBackground: false,
                          terminalOutput: customLogs.join("\n"),
                        },
                        {
                          steps: 2,
                          action: "verify_build",
                          cmd: "Test-Path .next/standalone",
                          msg: "Verified standalone bundle output",
                          isSuccess: true,
                          duration: "0.2s",
                          cwd,
                          terminalOutput: "True\nBuild artifacts verified: .next/standalone/server.js exists.",
                        },
                      ],
                    }
                  : msg
              )
            );
            setTimeout(() => setActivePathHighlight("idle"), 3000);
          }, 1400);
        }, remainingTime);
      }
    }, thresholdMs);
  };

  // Kill Task handler
  const killTask = (taskId: string) => {
    if (activeIntervalsRef.current[taskId]) {
      clearInterval(activeIntervalsRef.current[taskId]);
      delete activeIntervalsRef.current[taskId];
    }
    setActiveTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "killed",
              logs: [
                ...t.logs,
                `[${new Date().toLocaleTimeString()}] 🛑 Process tree terminated by user signal (SIGKILL).`,
              ],
            }
          : t
      )
    );

    // Notify in chat
    const task = activeTasks.find((t) => t.id === taskId);
    if (task) {
      setChat((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `🛑 Background process **PID: ${task.pid}** (\`${task.command}\`) was terminated. Resources released.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  };

  // Custom User Input Handler
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isWorking) return;
    const rawText = inputVal.trim();
    const lower = rawText.toLowerCase();
    setInputVal("");

    const runningTasks = activeTasks.filter((t) => t.status === "running");
    const activeTask = runningTasks[0];
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: rawText,
      timestamp: timeStr,
    };
    setChat((prev) => [...prev, userMsg]);

    // 2. CONCURRENT CHECK: User asks for status of running task
    if (
      lower.includes("status") ||
      lower.includes("progress") ||
      lower.includes("how is") ||
      lower.includes("check task")
    ) {
      if (activeTask) {
        const elapsedSec = Math.round((Date.now() - activeTask.startTime) / 1000);
        const lastLog =
          activeTask.logs[activeTask.logs.length - 1] || "Process running...";
        setTimeout(() => {
          setChat((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `🔍 **Task Status Report** (PID: \`${activeTask.pid}\`)\n\n- **Command**: \`${activeTask.command}\`\n- **Mode**: ${activeTask.isDaemon ? "Daemon (Infinite)" : "Finite Task"}\n- **Elapsed Time**: ${elapsedSec}s\n- **Latest Log**: \`${lastLog}\`\n\nThe process is healthy and active. I am monitoring it in the background while keeping the chat open for you.`,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }, 300);
        return;
      } else {
        setTimeout(() => {
          setChat((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: "There are currently no active background tasks running.",
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }, 300);
        return;
      }
    }

    // 3. CONCURRENT CHECK: User asks to stop / kill running task
    if (
      lower.includes("stop") ||
      lower.includes("kill") ||
      lower.includes("cancel") ||
      lower.includes("terminate")
    ) {
      if (activeTask) {
        killTask(activeTask.id);
        return;
      }
    }

    // 4. CONCURRENT CHECK: General conversation / questions while task is running
    if (
      lower.includes("who are you") ||
      lower.includes("chat") ||
      lower.includes("ip") ||
      lower.includes("hello") ||
      lower.includes("hi")
    ) {
      setTimeout(() => {
        setChat((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `👋 **Yes, brother!** I can chat with you and answer questions completely uninterrupted, even while background task **PID: ${
              activeTask ? activeTask.pid : "None"
            }** is running in the Tasks Node! This is the power of the non-blocking architecture.`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }, 300);
      return;
    }

    // 5. Otherwise, simulate as a command
    if (rawText.includes("dev") || rawText.includes("watch") || rawText.includes("start")) {
      executeSimulation(rawText, 999999, true, [
        "Starting development server...",
        "Ready in 1450ms",
        "Listening on http://localhost:3000",
        "GET / 200 in 42ms",
      ]);
    } else if (
      rawText.includes("build") ||
      rawText.includes("install") ||
      rawText.includes("clone")
    ) {
      executeSimulation(rawText, 4500, false, [
        "Resolving package dependencies...",
        "Fetching 48 tarballs...",
        "Building production bundle (turbopack)...",
        "Compiled successfully in 4.1s",
        "Static pages generated (10/10)",
      ]);
    } else {
      executeSimulation(rawText, 600, false, [
        "Directory: D:\\Coding\\PROJECTS\\Next\\Nexus_v2",
        "Mode                 LastWriteTime         Length Name",
        "d-----        24-09-2026  12:00 PM                frontend",
        "d-----        24-09-2026  12:00 PM                backend",
        "-a----        24-09-2026  11:30 AM           1420 package.json",
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#080711] text-white overflow-hidden font-sans">
      {/* 1. Header Toolbar & Architecture Navigator */}
      <header className="shrink-0 border-b border-[#4c227b]/40 bg-[#140d24]/70 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#a855f7] to-[#c084fc] flex items-center justify-center shadow-lg shadow-[#a855f7]/30">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Nexus 3-Path Engine Sandbox
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#c084fc]">
                Zero Tokens
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">
              Interactive simulator for Sync Threshold, Background Tasks & Reactive Wakeup
            </p>
          </div>
        </div>

        {/* Live Diagram Path Indicator */}
        <div className="flex items-center gap-2 text-xs bg-black/40 border border-[#4c227b]/30 rounded-xl px-3 py-1.5 font-mono">
          <span className="text-zinc-500">Flow:</span>
          <span
            className={`px-2 py-0.5 rounded transition-all ${
              activePathHighlight === "path1"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/30"
                : "text-zinc-500"
            }`}
          >
            🟢 Path 1 (Fast)
          </span>
          <span className="text-zinc-600">→</span>
          <span
            className={`px-2 py-0.5 rounded transition-all ${
              activePathHighlight === "path2"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/30"
                : "text-zinc-500"
            }`}
          >
            ⚪ Path 2 (Task)
          </span>
          <span className="text-zinc-600">→</span>
          <span
            className={`px-2 py-0.5 rounded transition-all ${
              activePathHighlight === "wakeup"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm shadow-blue-500/30 animate-pulse"
                : "text-zinc-500"
            }`}
          >
            ⚡ Wakeup
          </span>
          <span className="text-zinc-600">|</span>
          <span
            className={`px-2 py-0.5 rounded transition-all ${
              activePathHighlight === "path3"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/30"
                : "text-zinc-500"
            }`}
          >
            🟠 Path 3 (Daemon)
          </span>
        </div>

        {/* Threshold Slider Control */}
        <div className="flex items-center gap-3 bg-black/40 border border-[#4c227b]/30 rounded-xl px-3 py-1.5">
          <Sliders className="h-3.5 w-3.5 text-[#a855f7]" />
          <span className="text-xs text-zinc-400 font-mono">
            Threshold: <strong className="text-white">{thresholdMs}ms</strong>
          </span>
          <input
            type="range"
            min="500"
            max="4000"
            step="250"
            value={thresholdMs}
            onChange={(e) => setThresholdMs(Number(e.target.value))}
            className="w-24 accent-[#a855f7] cursor-pointer"
          />
        </div>
      </header>

      {/* 2. Presets Quick-Bar */}
      <div className="shrink-0 bg-[#0d091a] border-b border-[#4c227b]/20 px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-medium shrink-0">Try Presets:</span>
          {/* Preset 1: Fast Command */}
          <button
            onClick={() =>
              executeSimulation(
                "git status",
                450,
                false,
                [
                  "On branch main",
                  "Your branch is up to date with 'origin/main'.",
                  "nothing to commit, working tree clean",
                ]
              )
            }
            disabled={isWorking}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 cursor-pointer disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span>Path 1: Fast (&lt;1500ms)</span>
          </button>

          {/* Preset 2: Finite Task */}
          <button
            onClick={() =>
              executeSimulation(
                "npm run build",
                4200,
                false,
                [
                  "Creating optimized production build...",
                  "Compiled successfully in 2.8s",
                  "Running TypeScript typechecks...",
                  "Generating static routes (12/12)...",
                  "Finalizing page bundles...",
                ]
              )
            }
            disabled={isWorking}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-950/40 border border-[#a855f7]/30 hover:border-[#a855f7]/60 text-purple-300 cursor-pointer disabled:opacity-50"
          >
            <Clock className="h-3.5 w-3.5 text-[#c084fc]" />
            <span>Path 2: Long Task (4.2s + Wakeup)</span>
          </button>

          {/* Preset 3A: Daemon Server (Verified) */}
          <button
            onClick={() =>
              executeSimulation(
                "npm run dev",
                999999,
                true,
                [
                  "▲ Next.js 16.3.4 (Turbopack)",
                  "- Local: http://localhost:3000",
                  "- Network: http://192.168.1.15:3000",
                  "✓ Ready in 1.4s (Listening on http://localhost:3000)",
                  "GET / 200 in 38ms",
                ]
              )
            }
            disabled={isWorking}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 cursor-pointer disabled:opacity-50"
          >
            <Server className="h-3.5 w-3.5 text-amber-400" />
            <span>Path 3A: Server (Auto-Verified)</span>
          </button>

          {/* Preset 3B: Daemon Boot Crash */}
          <button
            onClick={() =>
              executeSimulation(
                "python server.py --port 3000",
                999999,
                true,
                [
                  "Starting Uvicorn server...",
                  "Binding to 0.0.0.0:3000...",
                  "Error: listen EADDRINUSE: address already in use 0.0.0.0:3000",
                ]
              )
            }
            disabled={isWorking}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 cursor-pointer disabled:opacity-50"
          >
            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
            <span>Path 3B: Crash (Port Taken)</span>
          </button>
        </div>

        <button
          onClick={() => {
            setChat([]);
            setActiveTasks([]);
            Object.values(activeIntervalsRef.current).forEach((i) =>
              clearInterval(i)
            );
            activeIntervalsRef.current = {};
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-md transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {/* 3. Main Split View: Left = Chat Feed | Right = Active Tasks Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Chat Feed */}
        <div className="flex-1 flex flex-col justify-between border-r border-[#4c227b]/30 bg-[#080711]">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {chat.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    msg.role === "user"
                      ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                      : msg.isReactiveWakeup
                      ? "bg-blue-600/30 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20"
                      : "bg-[#140d24] border-[#4c227b]/50 text-[#c084fc]"
                  }`}
                >
                  {msg.role === "user" ? (
                    <UserIcon className="h-4 w-4" />
                  ) : msg.isReactiveWakeup ? (
                    <Zap className="h-4 w-4 animate-bounce" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Content Bubble */}
                <div
                  className={`flex flex-col space-y-2 ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-xl ${
                      msg.role === "user"
                        ? "bg-[#a855f7] text-white shadow-md shadow-[#a855f7]/20 font-medium"
                        : msg.isReactiveWakeup
                        ? "bg-blue-950/50 border border-blue-500/50 text-blue-100 shadow-lg"
                        : msg.status === "in_progress"
                        ? "bg-[#140d24] border border-purple-500/40 text-zinc-200 shadow-lg shadow-purple-950/30"
                        : "bg-[#140d24] border border-[#4c227b]/40 text-zinc-200"
                    }`}
                  >
                    {/* Header Pill for Assistant Message Status */}
                    {msg.role === "assistant" && msg.status && (
                      <div className="flex items-center justify-between gap-2 border-b border-[#4c227b]/30 pb-1.5 mb-2.5">
                        <span className="text-[10px] font-mono text-purple-300 font-semibold flex items-center gap-1.5">
                          <Bot className="h-3 w-3 text-purple-400" /> Nexus Assistant
                        </span>
                        {msg.status === "in_progress" ? (
                          <span className="text-[10px] font-mono bg-purple-950/80 border border-purple-500/50 text-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm shadow-purple-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                            In Progress (Awaiting Process)
                          </span>
                        ) : msg.status === "completed" ? (
                          <span className="text-[10px] font-mono bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            Completed
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-rose-950/60 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-rose-400" />
                            Failed
                          </span>
                        )}
                      </div>
                    )}

                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Pending Remaining Tasks Banner (When In-Progress) */}
                    {msg.status === "in_progress" && (
                      <div className="mt-3 rounded-xl bg-purple-950/40 border border-purple-500/30 p-2.5 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-purple-300">
                          <Clock className="h-3.5 w-3.5 animate-spin text-purple-400 shrink-0" />
                          <span className="font-semibold text-zinc-200">
                            AI Standing By · Background task actively running
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          The triggered command is running in the background. The AI is actively monitoring it; once the process finishes, it will autonomously execute all queued remaining tasks below.
                        </p>
                        {msg.remainingTasks && msg.remainingTasks.length > 0 && (
                          <div className="pt-1.5 flex flex-col gap-1 border-t border-purple-900/40">
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Queued Remaining Tasks:
                            </span>
                            {msg.remainingTasks.map((task, tidx) => (
                              <span
                                key={tidx}
                                className="text-[10px] text-purple-200 font-mono flex items-center gap-1.5"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                                {task}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Render Execution Steps In The 'Worked for {time}' Wrapper */}
                  {msg.executions && msg.executions.length > 0 && (
                    <div className="w-full min-w-[340px] max-w-xl">
                      <ExecutionStepsWrapper
                        executions={msg.executions}
                        workedTime={msg.workedTime}
                        isWorking={msg.status === "in_progress"}
                      />
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-500 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Currently Working Step (Live Pulsing) */}
            {isWorking && (
              <div className="flex items-start gap-3 max-w-lg mr-auto">
                <div className="h-7 w-7 rounded-lg bg-[#140d24] border border-[#4c227b]/50 text-[#c084fc] flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl bg-[#140d24] border border-[#a855f7]/40 px-4 py-3 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#a855f7] animate-ping" />
                    <span className="font-mono text-zinc-200">
                      {currentWorkingOn}
                    </span>
                    <span className="text-[10px] font-mono text-[#c084fc] bg-[#a855f7]/20 px-2 py-0.5 rounded-full">
                      {liveSeconds}s
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Evaluating against {thresholdMs}ms threshold...
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Active Task Quick Actions (Demonstrates Concurrent Chat & Control) */}
          {activeTasks.some((t) => t.status === "running") && (
            <div className="px-4 py-2 bg-[#0d091a] border-t border-[#4c227b]/20 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-zinc-500 font-mono text-[10px] shrink-0">
                Concurrent Prompts:
              </span>
              <button
                type="button"
                onClick={() => {
                  setInputVal("What is the status of my task?");
                }}
                className="px-2.5 py-1 rounded-full bg-purple-950/40 border border-[#a855f7]/30 hover:border-[#a855f7]/70 text-purple-200 transition-colors shrink-0 cursor-pointer"
              >
                🔍 &quot;What is the status?&quot;
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputVal("Stop the running task");
                }}
                className="px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-500/30 hover:border-rose-500/70 text-rose-200 transition-colors shrink-0 cursor-pointer"
              >
                🛑 &quot;Stop running task&quot;
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputVal("Can you still chat while this runs?");
                }}
                className="px-2.5 py-1 rounded-full bg-blue-950/40 border border-blue-500/30 hover:border-blue-500/70 text-blue-200 transition-colors shrink-0 cursor-pointer"
              >
                💬 &quot;Can you still chat?&quot;
              </button>
              <button
                type="button"
                onClick={() => {
                  executeSimulation("git status", 450, false, [
                    "On branch main",
                    "working tree clean (ran in parallel!)",
                  ]);
                }}
                className="px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/70 text-emerald-200 transition-colors shrink-0 cursor-pointer"
              >
                ⚡ &quot;Run git status in parallel&quot;
              </button>
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <form
            onSubmit={handleCustomSubmit}
            className="p-4 bg-[#140d24]/60 border-t border-[#4c227b]/30 flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Type any command (e.g. dir, npm run build, npm run dev)..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isWorking}
              className="flex-1 bg-black/60 border border-[#4c227b]/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#a855f7] font-mono"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isWorking}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#c084fc] hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#a855f7]/30 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Simulate</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live Tasks Drawer (The "Tasks" Node in Your Diagram) */}
        <div className="w-96 flex flex-col bg-[#0b0816] border-l border-[#4c227b]/30">
          {/* Drawer Header */}
          <div className="px-4 py-3 border-b border-[#4c227b]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#a855f7]" />
              <h2 className="text-xs font-bold text-zinc-200 tracking-wide uppercase">
                Active Tasks Node
              </h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 bg-[#140d24] border border-[#4c227b]/40 px-2 py-0.5 rounded-full">
              {activeTasks.filter((t) => t.status === "running").length} Active
            </span>
          </div>

          {/* Task Cards List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTasks.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <Clock className="h-8 w-8 text-zinc-600 mb-2 opacity-60" />
                <p className="text-xs font-medium text-zinc-400">No Background Tasks</p>
                <p className="text-[11px] mt-1 text-zinc-600">
                  Commands that exceed the {thresholdMs}ms threshold will automatically be promoted here.
                </p>
              </div>
            ) : (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-3.5 font-mono text-xs transition-all ${
                    task.status === "running"
                      ? "bg-[#140d24] border-[#a855f7]/50 shadow-md shadow-[#a855f7]/10"
                      : task.status === "completed"
                      ? "bg-emerald-950/20 border-emerald-500/40 opacity-75"
                      : "bg-rose-950/20 border-rose-500/40 opacity-70"
                  }`}
                >
                  {/* Task Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {task.status === "running" ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      ) : task.status === "completed" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <StopCircle className="h-3.5 w-3.5 text-rose-400" />
                      )}
                      <span className="font-bold text-zinc-200 truncate max-w-[150px]">
                        {task.command}
                      </span>
                    </div>

                    {/* Kill Button (Active for Running Tasks) */}
                    {task.status === "running" && (
                      <button
                        onClick={() => killTask(task.id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/30 hover:bg-rose-600/60 border border-rose-500/50 text-rose-200 text-[10px] font-sans font-semibold cursor-pointer"
                      >
                        <Square className="h-2.5 w-2.5 fill-current" /> Kill
                      </button>
                    )}
                  </div>

                  {/* Task Meta details */}
                  <div className="text-[10px] text-zinc-400 space-y-0.5 mb-2 border-b border-zinc-800 pb-2">
                    <div className="flex justify-between">
                      <span>PID:</span>
                      <span className="text-zinc-200 font-bold">{task.pid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span
                        className={
                          task.isDaemon ? "text-amber-400" : "text-purple-300"
                        }
                      >
                        {task.isDaemon ? "Daemon (Infinite)" : "Finite Job"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span
                        className={
                          task.status === "running"
                            ? "text-emerald-400 font-semibold"
                            : task.status === "completed"
                            ? "text-zinc-300"
                            : "text-rose-400"
                        }
                      >
                        {task.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Live Terminal Log Stream Window */}
                  <div className="bg-black/90 rounded-lg p-2 border border-zinc-800 font-mono text-[10px] max-h-36 overflow-y-auto space-y-0.5">
                    {task.logs.map((log, lIdx) => (
                      <div key={lIdx} className="text-zinc-300 break-all leading-tight">
                        {log}
                      </div>
                    ))}
                    {task.status === "running" && (
                      <span className="inline-block w-1.5 h-3 bg-[#a855f7] animate-pulse ml-0.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
