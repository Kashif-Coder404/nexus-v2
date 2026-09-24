"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Monitor,
  Play,
  SendHorizontal,
  Server,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";

type TaskStatus =
  | "running"
  | "waiting_for_input"
  | "completed"
  | "failed"
  | "killed";

type StepType = "command" | "file" | "app" | "browser" | "daemon";

interface DemoStep {
  name: string;
  type: StepType;
  detail: string;
  cmd?: string;
  logs: string[];
  duration: number;
  daemon?: boolean;
}

interface ChatStep extends DemoStep {
  id: string;
  status: TaskStatus;
  liveLogs: string[];
  pid?: number;
  port?: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  workedSeconds?: number;
  steps?: ChatStep[];
}

interface DemoCase {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  response: string;
  steps: DemoStep[];
}

const DEMO_CASES: DemoCase[] = [
  {
    id: "student",
    label: "Student",
    icon: <FileText className="h-3.5 w-3.5" />,
    prompt:
      "Find my DBMS assignment PDF, put it in my College/DBMS folder, and open it.",
    response:
      "Done. I found the assignment, moved it into College/DBMS, and opened the PDF.",
    steps: [
      {
        name: "Find DBMS assignment",
        type: "file",
        detail: "Search Downloads and Documents",
        duration: 1100,
        logs: [
          "Searching Downloads...",
          "Searching Documents...",
          "Found: DBMS_Assignment_3.pdf",
          "1 matching file",
        ],
      },
      {
        name: "Move to College/DBMS",
        type: "file",
        detail: "Create folder and move the PDF",
        duration: 900,
        logs: [
          'Creating "College/DBMS"...',
          "Moving DBMS_Assignment_3.pdf...",
          "Move completed",
        ],
      },
      {
        name: "Open assignment",
        type: "app",
        detail: "Launch the default PDF viewer",
        duration: 900,
        logs: [
          "Launching default PDF application...",
          "Window detected",
          "Document opened",
        ],
      },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    icon: <Monitor className="h-3.5 w-3.5" />,
    prompt:
      "Open Chrome, play my study playlist, and enable Focus mode on my PC.",
    response:
      "Done. Chrome is open with your playlist and Windows Focus mode is enabled.",
    steps: [
      {
        name: "Launch Chrome",
        type: "app",
        detail: "Start chrome.exe and verify the window",
        duration: 850,
        cmd: "Start-Process chrome.exe",
        logs: [
          "Starting chrome.exe...",
          "Waiting for Chrome window...",
          "Window detected",
        ],
      },
      {
        name: "Open study playlist",
        type: "browser",
        detail: "Open the saved playlist in Chrome",
        duration: 1200,
        cmd: "Open saved study playlist",
        logs: [
          "Opening saved playlist...",
          "Chrome tab created",
          "Playlist loaded",
        ],
      },
      {
        name: "Enable Focus mode",
        type: "app",
        detail: "Enable Windows notification focus",
        duration: 850,
        cmd: "Enable Windows Focus",
        logs: [
          "Checking Windows notification settings...",
          "Updating Focus mode...",
          "Focus mode enabled",
        ],
      },
    ],
  },
  {
    id: "family",
    label: "Family",
    icon: <ImageIcon className="h-3.5 w-3.5" />,
    prompt:
      "Find the family photos from last month and make a folder on my desktop for them.",
    response:
      "Done. I found the matching photos and organized them into Desktop/Family Photos.",
    steps: [
      {
        name: "Find family photos",
        type: "file",
        detail: "Filter Pictures by date and image type",
        duration: 1400,
        logs: [
          "Scanning Pictures...",
          "Filtering image extensions...",
          "Filtering modified dates...",
          "Found 42 matching images",
        ],
      },
      {
        name: "Create Desktop folder",
        type: "file",
        detail: "Desktop/Family Photos",
        duration: 650,
        logs: ['Creating "Desktop/Family Photos"...', "Folder created"],
      },
      {
        name: "Move 42 photos",
        type: "file",
        detail: "Organize matching files",
        duration: 1800,
        logs: [
          "Preparing 42 file moves...",
          "Moving files...",
          "42 / 42 moved",
          "Organization complete",
        ],
      },
    ],
  },
  {
    id: "work",
    label: "Work",
    icon: <FolderOpen className="h-3.5 w-3.5" />,
    prompt:
      "Clean my Downloads folder: put PDFs, images, and ZIP files into separate folders.",
    response: "Done. I organized the matching files without deleting anything.",
    steps: [
      {
        name: "Scan Downloads",
        type: "file",
        detail: "Inspect file types before changing anything",
        duration: 1200,
        logs: [
          "Scanning Downloads...",
          "87 files discovered",
          "64 files match the requested categories",
        ],
      },
      {
        name: "Create categories",
        type: "file",
        detail: "PDFs · Images · ZIP Files",
        duration: 700,
        logs: [
          'Creating "PDFs"...',
          'Creating "Images"...',
          'Creating "ZIP Files"...',
          "Folders ready",
        ],
      },
      {
        name: "Organize files",
        type: "file",
        detail: "Move 64 matching files",
        duration: 1900,
        logs: [
          "Moving PDFs...",
          "Moving images...",
          "Moving ZIP files...",
          "64 files moved",
          "23 unrelated files left untouched",
        ],
      },
    ],
  },
  {
    id: "developer",
    label: "Developer",
    icon: <Server className="h-3.5 w-3.5" />,
    prompt:
      "Clone my Nexus repo, install dependencies, and start the dev server in the background.",
    response:
      "Done. Dependencies are installed and the dev server is running in the background.",
    steps: [
      {
        name: "Clone repository",
        type: "command",
        detail: "Clone into the workspace",
        duration: 1200,
        cmd: "git clone <repository>",
        logs: [
          "Cloning repository...",
          "Receiving objects...",
          "Repository cloned",
        ],
      },
      {
        name: "Install dependencies",
        type: "command",
        detail: "Run npm install and wait for completion",
        duration: 1800,
        cmd: "npm install",
        logs: [
          "npm install",
          "added 312 packages",
          "audited 313 packages",
          "npm install completed",
        ],
      },
      {
        name: "Start dev server",
        type: "daemon",
        detail: "Background process · PID 18420 · port 3100",
        duration: 1700,
        cmd: "npm run dev",
        daemon: true,
        logs: [
          "> nexus-v2@dev",
          "> next dev -p 3100",
          "Starting Next.js...",
          "Ready in 1.7s",
          "Local: http://localhost:3100",
        ],
      },
    ],
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    sender: "assistant",
    timestamp: "09:24",
    text: "I’m Nexus. Tell me the outcome you want on your Windows PC. I’ll plan the work, execute it through the local agent, and show the live progress here.",
  },
];

function statusIcon(status: TaskStatus) {
  if (status === "completed")
    return <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" />;
  if (status === "running")
    return (
      <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
    );
  if (status === "killed")
    return (
      <Square className="h-3.5 w-3.5 text-zinc-500 fill-current shrink-0" />
    );
  if (status === "failed")
    return <CircleAlert className="h-4 w-4 text-rose-400 shrink-0" />;
  return <Clock3 className="h-4 w-4 text-amber-400 shrink-0" />;
}

function StepIcon({ type }: { type: StepType }) {
  if (type === "file") return <FolderOpen className="h-3.5 w-3.5" />;
  if (type === "app") return <Monitor className="h-3.5 w-3.5" />;
  if (type === "browser") return <Activity className="h-3.5 w-3.5" />;
  if (type === "daemon") return <Server className="h-3.5 w-3.5" />;
  return <Zap className="h-3.5 w-3.5" />;
}

export default function SingleChatTasksDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState("student");
  const [copied, setCopied] = useState<string | null>(null);
  const [showCases, setShowCases] = useState(true);
  const [activeTerminal, setActiveTerminal] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const activeProcesses = useMemo(
    () =>
      messages
        .flatMap((message) => message.steps ?? [])
        .filter((step) => step.status === "running" || step.daemon),
    [messages],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, expandedMessage, expandedStep]);

  const copyLogs = async (step: ChatStep) => {
    await navigator.clipboard.writeText(step.liveLogs.join("\n"));
    setCopied(step.id);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => window.setTimeout(resolve, ms));

  const runCase = async (demo: DemoCase) => {
    if (running) return;

    setRunning(true);
    setShowCases(false);

    const stamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userId = `user-${Date.now()}`;
    const assistantId = `assistant-${Date.now()}`;

    const userMessage: ChatMessage = {
      id: userId,
      sender: "user",
      timestamp: stamp,
      text: demo.prompt,
    };

    const initialSteps: ChatStep[] = demo.steps.map((step, index) => ({
      ...step,
      id: `${assistantId}-step-${index}`,
      status: "waiting_for_input",
      liveLogs: [],
      pid: step.daemon ? 18420 : undefined,
      port: step.daemon ? 3100 : undefined,
    }));

    const assistantMessage: ChatMessage = {
      id: assistantId,
      sender: "assistant",
      timestamp: stamp,
      text: "I’m working on that now.",
      workedSeconds: 0,
      steps: initialSteps,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setExpandedMessage(assistantId);

    let seconds = 0;
    const timer = window.setInterval(() => {
      seconds += 1;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, workedSeconds: seconds } : m,
        ),
      );
    }, 1000);

    try {
      for (let index = 0; index < demo.steps.length; index++) {
        const step = demo.steps[index];
        const stepId = `${assistantId}-step-${index}`;

        setActiveTerminal(stepId);
        setExpandedStep(stepId);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  steps: m.steps?.map((s, i) =>
                    i === index
                      ? {
                          ...s,
                          status: "running",
                          liveLogs: [step.logs[0]],
                        }
                      : s,
                  ),
                }
              : m,
          ),
        );

        for (let logIndex = 1; logIndex < step.logs.length; logIndex++) {
          await sleep(
            Math.max(220, Math.floor(step.duration / step.logs.length)),
          );
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    steps: m.steps?.map((s, i) =>
                      i === index
                        ? {
                            ...s,
                            liveLogs: [...s.liveLogs, step.logs[logIndex]],
                          }
                        : s,
                    ),
                  }
                : m,
            ),
          );
        }

        await sleep(250);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  text:
                    index === demo.steps.length - 1
                      ? demo.response
                      : "I’m working on that now.",
                  steps: m.steps?.map((s, i) =>
                    i === index
                      ? {
                          ...s,
                          status: "completed",
                          liveLogs: step.logs,
                        }
                      : s,
                  ),
                }
              : m,
          ),
        );

        // Keep a background daemon visible after its command finishes.
        if (step.daemon) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    steps: m.steps?.map((s, i) =>
                      i === index
                        ? {
                            ...s,
                            status: "running",
                            detail:
                              "Background process · PID 18420 · port 3100 · running",
                          }
                        : s,
                    ),
                  }
                : m,
            ),
          );
        }
      }
    } finally {
      window.clearInterval(timer);
      setActiveTerminal(null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text: demo.response,
                workedSeconds: seconds,
              }
            : m,
        ),
      );
      setRunning(false);
    }
  };

  const send = () => {
    const value = input.trim();
    if (!value || running) return;

    setInput("");

    const custom: DemoCase = {
      id: "custom",
      label: "Custom",
      icon: <MessageSquare className="h-3.5 w-3.5" />,
      prompt: value,
      response:
        "This is a demo execution. Connect these step events to your Nexus C# agent to make the same UI execute real Windows actions.",
      steps: [
        {
          name: "Understand request",
          type: "command",
          detail: "Natural language → execution plan",
          duration: 850,
          logs: [
            "Reading user request...",
            "Building execution plan...",
            "Plan ready",
          ],
        },
        {
          name: "Execute with Nexus Agent",
          type: "command",
          detail: "Local Windows execution layer",
          duration: 1200,
          cmd: "POST /test-cmd",
          logs: [
            "Sending action to local agent...",
            "Waiting for execution result...",
            "Demo execution completed",
          ],
        },
      ],
    };

    runCase(custom);
  };

  const clearChat = () => {
    if (running) return;
    setMessages(INITIAL_MESSAGES);
    setExpandedMessage(null);
    setExpandedStep(null);
    setActiveTerminal(null);
  };

  return (
    <div className="min-h-screen bg-[#07050b] text-[#f5f0fa] flex flex-col">
      <header className="sticky top-0 z-30 border-b border-violet-950/70 bg-[#07050b]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-700 via-violet-500 to-fuchsia-400 text-white shadow-[0_0_26px_rgba(139,92,246,0.3)] flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Nexus</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-950/60 text-violet-300">
                  AI Desktop Agent
                </span>
              </div>
              <div className="text-[10px] text-zinc-500">
                {activeProcesses.length
                  ? `${activeProcesses.length} process active`
                  : "Ready to work"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCases((v) => !v)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-violet-950 text-[11px] text-zinc-400 hover:text-white hover:bg-violet-950/30"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Examples
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  showCases ? "rotate-180" : ""
                }`}
              />
            </button>
            <button
              onClick={clearChat}
              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-violet-950/30"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {showCases && (
        <div className="border-b border-violet-950/60 bg-[#0b0710]">
          <div className="max-w-4xl mx-auto px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] text-zinc-500">
                Click an example to actually run the demo.
              </div>
              <div className="text-[9px] text-violet-400/70">
                Live terminal included
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              {DEMO_CASES.map((demo) => (
                <button
                  key={demo.id}
                  disabled={running}
                  onClick={() => {
                    setSelectedCase(demo.id);
                    runCase(demo);
                  }}
                  className={`group text-left p-3 rounded-xl border transition-all disabled:opacity-50 ${
                    selectedCase === demo.id
                      ? "border-violet-700/70 bg-violet-950/40 shadow-[0_0_22px_rgba(124,58,237,0.12)]"
                      : "border-violet-950 bg-[#100a15] hover:border-violet-800 hover:bg-violet-950/25"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-violet-100">
                      {demo.icon}
                      {demo.label}
                    </div>
                    <Play className="h-3 w-3 text-violet-500 opacity-0 group-hover:opacity-100" />
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-zinc-500 line-clamp-3">
                    {demo.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-8">
        <div className="space-y-8">
          {messages.map((message) => {
            const isUser = message.sender === "user";
            const isExpanded = expandedMessage === message.id;
            const isLatest = message.id === messages[messages.length - 1]?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`${isUser ? "max-w-[78%]" : "w-full"}`}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-[10px] text-zinc-600">
                      {isUser ? "You" : "Nexus"} · {message.timestamp}
                    </span>
                  </div>

                  <div
                    className={
                      isUser
                        ? "rounded-2xl rounded-tr-md bg-gradient-to-br from-violet-900/80 to-violet-950/50 border border-violet-800/50 px-4 py-3 text-sm leading-6 text-violet-50"
                        : "text-sm leading-7 text-zinc-300"
                    }
                  >
                    {message.text}
                  </div>

                  {!isUser && message.steps?.length ? (
                    <div className="mt-4 rounded-2xl border border-violet-950 bg-[#0c0811] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
                      <button
                        onClick={() =>
                          setExpandedMessage(isExpanded ? null : message.id)
                        }
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-violet-950/20"
                      >
                        <div className="flex items-center gap-2">
                          {running && isLatest ? (
                            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                          ) : (
                            <Check className="h-3.5 w-3.5 text-violet-400" />
                          )}
                          <span className="text-xs font-medium text-zinc-300">
                            {running && isLatest ? "Working" : "Completed"}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            · {message.steps.length} steps
                            {message.workedSeconds
                              ? ` · ${message.workedSeconds}s`
                              : ""}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-zinc-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-zinc-600" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-violet-950/80">
                          {message.steps.map((step) => {
                            const stepOpen = expandedStep === step.id;
                            const terminalOpen =
                              activeTerminal === step.id || stepOpen;

                            return (
                              <div
                                key={step.id}
                                className="border-b last:border-b-0 border-violet-950/60"
                              >
                                <button
                                  onClick={() =>
                                    setExpandedStep(stepOpen ? null : step.id)
                                  }
                                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-violet-950/15"
                                >
                                  {statusIcon(step.status)}

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-zinc-200 truncate">
                                        {step.name}
                                      </span>
                                      <span className="hidden sm:inline-flex items-center gap-1 text-[9px] text-zinc-600">
                                        <StepIcon type={step.type} />
                                        {step.type}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-zinc-600 truncate mt-0.5">
                                      {step.detail}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {step.daemon &&
                                      step.status === "running" && (
                                        <span className="text-[9px] text-violet-400">
                                          LIVE
                                        </span>
                                      )}
                                    <ChevronDown
                                      className={`h-3.5 w-3.5 text-zinc-600 transition-transform ${
                                        stepOpen ? "rotate-180" : ""
                                      }`}
                                    />
                                  </div>
                                </button>

                                {terminalOpen && (
                                  <div className="px-4 pb-4">
                                    <div className="rounded-xl border border-violet-950 bg-[#050307] overflow-hidden shadow-[0_0_30px_rgba(109,40,217,0.08)]">
                                      <div className="px-3 py-2 border-b border-violet-950 flex items-center justify-between bg-[#09050d]">
                                        <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-500">
                                          <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                              step.status === "running"
                                                ? "bg-violet-400 animate-pulse"
                                                : "bg-violet-900"
                                            }`}
                                          />
                                          nexus-agent
                                          {step.cmd && (
                                            <span className="text-violet-400/80">
                                              $ {step.cmd}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {step.daemon &&
                                            step.status === "running" && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setMessages((prev) =>
                                                    prev.map((m) => ({
                                                      ...m,
                                                      steps: m.steps?.map(
                                                        (s) =>
                                                          s.id === step.id
                                                            ? {
                                                                ...s,
                                                                status:
                                                                  "killed",
                                                                detail:
                                                                  "Background process stopped",
                                                              }
                                                            : s,
                                                      ),
                                                    })),
                                                  );
                                                }}
                                                className="text-[9px] text-rose-400 hover:text-rose-300"
                                              >
                                                Stop
                                              </button>
                                            )}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              copyLogs(step);
                                            }}
                                            className="flex items-center gap-1 text-[9px] text-zinc-600 hover:text-zinc-300"
                                          >
                                            {copied === step.id ? (
                                              <Check className="h-3 w-3 text-violet-400" />
                                            ) : (
                                              <Copy className="h-3 w-3" />
                                            )}
                                            {copied === step.id
                                              ? "Copied"
                                              : "Copy"}
                                          </button>
                                        </div>
                                      </div>

                                      <div className="p-3 max-h-52 overflow-y-auto font-mono text-[10px] leading-5">
                                        {(step.liveLogs.length
                                          ? step.liveLogs
                                          : ["Waiting..."]
                                        ).map((log, i) => (
                                          <div
                                            key={`${step.id}-${i}`}
                                            className={
                                              log.includes("error") ||
                                              log.includes("ERROR")
                                                ? "text-rose-400"
                                                : log.includes("Ready") ||
                                                    log.includes("completed") ||
                                                    log.includes("Complete") ||
                                                    log.includes("✓")
                                                  ? "text-violet-300"
                                                  : "text-zinc-500"
                                            }
                                          >
                                            <span className="text-violet-950 mr-2">
                                              {String(i + 1).padStart(2, "0")}
                                            </span>
                                            {log}
                                          </div>
                                        ))}
                                        {step.status === "running" && (
                                          <div className="mt-1 text-violet-400 animate-pulse">
                                            ▌
                                          </div>
                                        )}
                                      </div>

                                      {step.daemon &&
                                        step.status === "running" && (
                                          <div className="px-3 py-2 border-t border-violet-950 bg-violet-950/15 flex items-center justify-between text-[9px]">
                                            <span className="text-violet-300">
                                              Background process running
                                            </span>
                                            <span className="text-zinc-500">
                                              PID {step.pid} · PORT {step.port}
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          <div ref={endRef} />
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-violet-950/70 bg-[#07050b]/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-5 pt-3 pb-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2 text-[10px] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Nexus Agent · Local Windows
            </div>

            {activeProcesses.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-violet-400">
                <Activity className="h-3 w-3" />
                {activeProcesses.length} active
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-violet-950 bg-[#100913] focus-within:border-violet-700/60 transition-colors">
            <div className="flex items-end gap-2 p-2">
              <button
                className="h-9 w-9 rounded-xl flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-violet-950/30"
                title="Attach file"
              >
                <Upload className="h-4 w-4" />
              </button>

              <textarea
                rows={1}
                value={input}
                disabled={running}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={
                  running
                    ? "Nexus is working..."
                    : "Tell Nexus what you want done on your PC..."
                }
                className="flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              />

              <button
                onClick={send}
                disabled={!input.trim() || running}
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-700 via-violet-500 to-fuchsia-500 text-white shadow-[0_0_24px_rgba(124,58,237,0.28)] flex items-center justify-center disabled:opacity-30"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="px-3 pb-2 flex items-center justify-between text-[9px] text-zinc-600">
              <span>Natural language · files · apps · terminal</span>
              <span>Enter to run</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
