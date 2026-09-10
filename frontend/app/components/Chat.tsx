"use client";
import React, { useEffect, useRef } from "react";
import UserMsg from "./UserMsg";
import AIMsg from "./AIMsg";
import SendMsg from "./SendMsg";
import useChat from "../store/useChat";
import { Sparkles, Trash2, Terminal } from "lucide-react";
import AIMsgBox from "./AIMsgBox";

const Chat = () => {
  const temp: any = {
    data: {
      executions: [
        {
          action: "in_built",
          cmd: JSON.stringify({
            action: "in_built",
            param: "echo hello world",
          }),
          exitCode: "0",
          isSuccess: true,
          msg: "Running the first command now...",
          steps: 1,
          terminalError: "",
          terminalOutput: "hello world\r\n",
        },
        {
          action: "in_built",
          cmd: JSON.stringify({
            action: "in_built",
            param: "echo kashif is great",
          }),
          exitCode: "0",
          isSuccess: true,
          msg: "That one's done! Running the second command...",
          steps: 2,
          terminalError: "",
          terminalOutput: "kashif is great\r\n",
        },
        {
          action: "in_built",
          cmd: JSON.stringify({
            action: "in_built",
            param: "echo nexus ai is working",
          }),
          exitCode: "0",
          isSuccess: true,
          msg: "And now for the final one! 😄",
          steps: 3,
          terminalError: "",
          terminalOutput: "nexus ai is working\r\n",
        },
      ],
      imageBase64: "",
      lastAIMsg:
        "All three commands have been successfully executed separately! 🎉",
      lastCMD: JSON.stringify({
        action: "in_built",
        param: "echo nexus ai is working",
      }),
      terminal:
        "hello world\r\n\nkashif is great\r\n\nnexus ai is working\r\n\n",
      terminalError: "",
    },
    message: "Chat message processed successfully",
    sessionId: "6aa234d0b252fdbb52605be2",
    success: true,
  };

  const chat = useChat((state) => state.chat);
  const session = useChat((state) => state.session);
  const clearChat = useChat((state) => state.clearChat);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-white  ">
      {/* Top Header Status Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-purple-500/20 bg-zinc-950/80 px-4 sm:px-8 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-900/50 border border-purple-500/30 text-purple-300">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
              Nexus Console
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[11px] text-zinc-400 font-mono">
              Session: {session ? session.slice(0, 16) + "..." : "6aa234d0..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {chat.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-purple-900/60 transition cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 mx-auto w-full">
        {chat.length === 0 ? (
          <div className="flex flex-col gap-6">
            {/* Welcome Banner */}
            <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-linear-to-r from-purple-950/30 to-zinc-900/40 border border-purple-500/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-900/50 border border-purple-500/30 mb-3 shadow-lg shadow-purple-900/40">
                <Sparkles className="h-6 w-6 text-purple-300 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Welcome to Nexus Desktop AI
              </h2>
              <p className="text-xs text-zinc-400 max-w-md mt-1 leading-relaxed">
                Control your system, execute Windows CMD & PowerShell commands,
                and explore files with multi-turn autonomous feedback.
              </p>
            </div>

            {/* Previewing the Sample Turn from temp */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Previewing Sample Turn from Temp Data:
              </div>
              <UserMsg message="Run three echo commands separately: echo hello world, echo kashif is great, and echo nexus ai is working" />
              {/* <AIMsg data={temp} /> */}
              <AIMsgBox data={temp} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chat.map((item, index) =>
              item.role === "user" ? (
                <UserMsg key={index} message={item.content} />
              ) : (
                // <AIMsg key={index} data={item.content} />
                <AIMsgBox data={item.content} />
              ),
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed Bottom Input Bar */}
      <footer className="sticky bottom-0 z-20 border-t border-purple-500/20 bg-zinc-950/90 backdrop-blur-md">
        <SendMsg />
      </footer>
    </div>
  );
};

export default Chat;
