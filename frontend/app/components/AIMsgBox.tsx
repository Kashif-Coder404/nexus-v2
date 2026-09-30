"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Bot } from "lucide-react";
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
function useTypewriter(text: string, speed = 12, isNew = false) {
  const [displayedText, setDisplayedText] = useState(isNew ? "" : text);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(text);
      return;
    }
    let index = 0;
    const interval = setInterval(() => {
      index += 3; // reveals 3 characters at a time for smooth reading
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, isNew, speed]);

  return displayedText;
}

const AIMsgBox = ({
  data,
  isLatest = false,
}: {
  data: AiData | any;
  isLatest?: boolean;
}) => {
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
  // Safely extract content and handle legacy stringified or object records
  let rawContent = normalized.content;
  let parsedContentObj: any = null;

  if (
    typeof rawContent === "string" &&
    (rawContent.trim().startsWith("{") || rawContent.trim().startsWith("["))
  ) {
    try {
      parsedContentObj = JSON.parse(rawContent);
    } catch {
      parsedContentObj = null;
    }
  } else if (rawContent && typeof rawContent === "object") {
    parsedContentObj = rawContent;
  }

  // Extract display message as a guaranteed string
  let messageText = "";
  if (parsedContentObj && typeof parsedContentObj === "object") {
    const candidate =
      parsedContentObj.lastAIMsg ??
      parsedContentObj.content ??
      parsedContentObj.msg ??
      parsedContentObj.message ??
      parsedContentObj.text;
    if (typeof candidate === "string") {
      messageText = candidate;
    } else if (candidate !== undefined && candidate !== null) {
      messageText =
        typeof candidate === "object"
          ? JSON.stringify(candidate, null, 2)
          : String(candidate);
    } else {
      messageText = JSON.stringify(parsedContentObj, null, 2);
    }
  } else if (typeof rawContent === "string") {
    messageText = rawContent;
  }

  // Fallbacks if messageText is still empty
  if (!messageText) {
    const fallback =
      normalized.lastAIMsg ??
      normalized.msg ??
      normalized.message ??
      normalized.text ??
      (typeof data === "string" ? data : "");
    if (typeof fallback === "string") {
      messageText = fallback;
    } else if (fallback && typeof fallback === "object") {
      messageText = JSON.stringify(fallback, null, 2);
    } else {
      messageText = String(fallback || "");
    }
  }

  const lastAIMsg: string = messageText;
  const isRecent =
    !data.timestamp || Date.now() - new Date(data.timestamp).getTime() < 15000;
  const displayedContent = useTypewriter(lastAIMsg, 12, isLatest && isRecent);
  // Extract executions safely, checking both top-level and legacy inner object
  const executions: ExecutionStep[] = Array.isArray(normalized.executions)
    ? normalized.executions
    : Array.isArray(parsedContentObj?.executions)
      ? parsedContentObj.executions
      : [];

  const rawImage: string | undefined =
    normalized.imageBase64 || parsedContentObj?.imageBase64;
  const imageSrc = rawImage
    ? rawImage.startsWith("data:")
      ? rawImage
      : `data:image/png;base64,${rawImage}`
    : null;

  const workedSeconds: number | undefined =
    normalized.workedSeconds ?? parsedContentObj?.workedSeconds;

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
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {String(displayedContent)}
        </ReactMarkdown>
      </div>
      {executions.length > 0 && (
        <ExecutionSteps
          executions={executions}
          isWorking={false}
          workedSeconds={workedSeconds}
        />
      )}
    </div>
  );
};

export default AIMsgBox;
