"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  LucideFolderOutput,
  RobotArm,
  Shell,
  Terminal,
  TerminalIcon,
  TerminalSquare,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import useChat from "../store/useChat";
import ExecutionSteps from "./ExecutionsStep";
export interface ExecutionStep {
  steps: number;
  action: string;
  cmd: string;
  msg: string;
  exitCode?: string;
  isSuccess: boolean;
  terminalOutput?: string;
  terminalError?: string;
  duration?: string;
  cwd?: string;
}

export interface AiData {
  executions?: ExecutionStep[];
  imageBase64?: string;
  lastAIMsg?: string;
  msg?: string;
  message?: string;
  lastCMD?: string;
  terminal?: string;
  terminalError?: string;
}

const AIMsgBox = ({ data }: { data: AiData | any }) => {
  const msgRef = useRef<HTMLDivElement>(null);
  const executionsRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Safely parse and normalize data whether it's a string, JSON string, or object
  let parsedData: any = data;
  const chat = useChat((state) => state.chat);
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = { lastAIMsg: data };
    }
  }

  // Handle nested data wrappers e.g. { data: { ... } }
  const normalized =
    parsedData &&
    typeof parsedData === "object" &&
    "data" in parsedData &&
    typeof parsedData.data === "object"
      ? parsedData.data
      : parsedData || {};
  const rawImage: string | undefined = normalized.imageBase64;
  const imageSrc = rawImage
    ? rawImage.startsWith("data:")
      ? rawImage
      : `data:image/png;base64,${rawImage}`
    : null;
  const lastAIMsg: string =
    normalized.content ||
    normalized.lastAIMsg ||
    normalized.msg ||
    normalized.message ||
    (typeof data === "string" && !normalized.lastAIMsg ? data : "") ||
    "";

  const executions: ExecutionStep[] = Array.isArray(normalized.executions)
    ? normalized.executions
    : [];

  // Scroll to the message when it first appears
  useEffect(() => {
    msgRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lastAIMsg]);

  // Scroll to executions ONLY when user opens/closes the accordion
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    executionsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [isOpen]);
  return (
    <div className="flex flex-col justify-center items-start w-full max-w-2xl sm:max-w-2xl p-2">
      {/* <div className="flex items-center justify-center rounded-full bg-purple-500 px-2 py-0.5 w-fit text-sm mb-2 text-white">N</div> */}
      {imageSrc && (
        <div className="flex justify-center items-center rounded-2xl overflow-hidden">
          <img
            className="rounded-2xl w-full h-full object-contain"
            src={imageSrc}
            alt=""
          />
        </div>
      )}
      <div className="flex items-center gap-2 m-2">
        <Bot className="h-10 w-10 text-brand-hover p-1.5 bg-brand-surface/80 rounded-lg border border-brand-border/40" />
        {/* <span className="text-sm font-semibold text-white">Nexus AI</span> */}
      </div>
      <div
        ref={msgRef}
        className="p-3.5 rounded-xl rounded-tl-none text-xl  text-start  font-normal leading-relaxed break-words [overflow-wrap:anywhere]"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lastAIMsg}</ReactMarkdown>
      </div>
      {executions.length > 0 && (
        <ExecutionSteps
          executions={executions}
          isWorking={false}
          workedSeconds={normalized.workedSeconds}
        />
      )}
    </div>
  );
};

export default AIMsgBox;
