"use client";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Copy,
  RobotArm,
  Shell,
  Terminal,
  TerminalIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
export interface ExecutionStep {
  steps: number;
  action: string;
  cmd: string;
  msg: string;
  exitCode?: string;
  isSuccess: boolean;
  terminalOutput?: string;
  terminalError?: string;
}
export interface AiData {
  executions: ExecutionStep[];
  imageBase64?: string;
  lastAIMsg?: string;
  lastCMD?: string;
  terminal?: string;
  terminalError?: string;
}
const commandDisplay = (param: object | string) => {
  if (typeof param === "string") return param;
  let string = "";
  if (typeof param === "object" && param !== null) {
    return Object.entries(param)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" ");
  }
  return String(param ?? "");
};
const Executions = ({ terminalData }: { terminalData: ExecutionStep }) => {
  return (
    <div className="flex flex-col w-full bg-black/70 border border-purple-500/30 rounded-xl p-3 gap-2.5 shadow-md">
      {/* TOP */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <span className="bg-purple-900/80 border border-purple-500/40 text-purple-200 font-bold rounded-lg px-2.5 py-0.5 text-xs">
            Step {terminalData.steps}
          </span>
          <span className="text-sm font-semibold text-purple-300 font-mono">
            {terminalData.action}
          </span>
        </div>
        <CheckCircle2
          className={`h-4 w-4 ${terminalData.isSuccess ? "text-emerald-400" : "text-rose-500"}`}
        />
      </div>
      {/* MIDDLE CMD BOX - Boxy Developer Console */}
      <div className="w-full rounded-lg bg-zinc-950/90 border border-zinc-800 p-2.5 flex flex-col gap-2">
        {/* Boxy Header */}
        <div className="flex justify-between items-center w-full text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-purple-500" />
            {/* <Terminal /> */}
            <span className="font-semibold uppercase tracking-wider text-zinc-300">
              {terminalData.msg}
            </span>
          </div>
          <Copy className="h-3.5 w-3.5 cursor-pointer text-zinc-400 hover:text-white transition" />
        </div>

        {/* Boxy Command Line */}
        <div className="text-xs font-mono text-purple-200 bg-black/70 px-2.5 py-2 rounded-md border border-purple-900/30 overflow-x-auto">
          <span className="text-purple-400 font-bold select-none mr-2">$</span>
          {commandDisplay(JSON.parse(terminalData.cmd).param)}
        </div>
        {/* Output Box */}
        {terminalData.terminalOutput && (
          <div className="flex flex-col gap-1 w-full border-t border-zinc-800/80 pt-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              output
            </span>
            <pre className="text-xs font-mono text-emerald-400/90 bg-black/50 p-2 rounded border border-zinc-800/60 whitespace-pre-wrap overflow-x-auto">
              {terminalData.terminalOutput.trim()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
const AIMsgBox = ({ data }: { data: AiData }) => {
  const msgRef = useRef<HTMLDivElement>(null);
  const executionsRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Scroll to the message when it first appears
  useEffect(() => {
    msgRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [data.lastAIMsg]);

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
    <div className="flex flex-col justify-center items-start w-full max-w-120 p-2 ">
      {/* <div className="flex items-center justify-center rounded-full bg-purple-500 px-2 py-0.5 w-fit text-sm mb-2 text-white">N</div> */}
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-7 w-7 text-purple-300 p-1.5 bg-purple-950/60 rounded-lg border border-purple-500/30" />
        <span className="text-sm font-semibold text-white">Nexus AI</span>
      </div>
      <div
        ref={msgRef}
        className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 shadow-md w-full text-lg font-normal text-zinc-200 leading-relaxed"
      >
        {data.lastAIMsg}
      </div>
      {data.executions.length !== 0 && (
        <div className="flex flex-col w-full mt-2 rounded-xl bg-purple-950/40 border-2 border-purple-400/20 overflow-hidden transition-all duration-300">
          {/* Executions of the ai */}
          <div
            className="flex items-center gap-2 justify-between w-full p-2.5 cursor-pointer select-none"
            ref={executionsRef}
          >
            <div className="flex items-center justify-center gap-2 font-bold">
              <span className="text-lg font-bold text-purple-200 px-2">
                AI Executions
              </span>
              <span className="text-purple-300 bg-purple-700 rounded-full px-2 text-sm mr-2 font-mono">
                {data.executions.length}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              disabled={data.executions.length === 0}
            >
              <ChevronDown
                className={`text-purple-200 mr-2 transition-transform duration-300 ease-in-out ${
                  isOpen ? "rotate-180" : ""
                }`}
                size={20}
                strokeWidth={2}
              />
            </button>
          </div>
          <div
            className={`flex flex-col gap-2 w-full transition-all duration-500 ease-in-out overflow-hidden ${
              isOpen
                ? "opacity-100 max-h-screen p-2 pt-0"
                : "opacity-0 max-h-0 p-0"
            }`}
          >
            {data.executions.length !== 0 &&
              data.executions.map((el) => {
                return (
                  <Executions
                    key={el.steps}
                    terminalData={el as ExecutionStep}
                  />
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMsgBox;
