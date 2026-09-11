"use client";
import {
  SendHorizonal,
  Loader2,
  Sparkles,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import React, { useState } from "react";
import { useUserCredentials } from "../store/useUserCredentials";
import useChat from "../store/useChat";

type ModelsName =
  | "gemini-3.5-flash-lite"
  | "gemini-3.5-flash"
  | "gemini-3.1-flash-live-preview";
type ModelType = {
  provider: "gemini";
  name: ModelsName;
  isLiveModel: boolean;
};
const Models: ModelType[] = [
  {
    provider: "gemini",
    name: "gemini-3.5-flash-lite",
    isLiveModel: false,
  },
  {
    provider: "gemini",
    name: "gemini-3.5-flash",
    isLiveModel: false,
  },
  {
    provider: "gemini",
    name: "gemini-3.1-flash-live-preview",
    isLiveModel: true,
  },
];
const SendMsg = () => {
  const [msg, setMsg] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [model, setModel] = useState<ModelType>({
    provider: "gemini",
    name: "gemini-3.1-flash-live-preview",
    isLiveModel: true,
  });
  const token = useUserCredentials((state) => state.token);
  const session = useChat((state) => state.session);
  const addChat = useChat((state) => state.addChat);
  const setSession = useChat((state) => state.setSession);

  const handleSendMsg = async () => {
    const actualMessage = msg.trim();
    if (!actualMessage || isSending) return;

    // 1. Optimistically display user's message right away
    addChat({
      role: "user",
      content: actualMessage,
    });
    setMsg("");
    setIsSending(true);

    const cloudbackendUrl = "https://nexus-v2-e38m.onrender.com";
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || cloudbackendUrl;

    try {
      const res = await fetch(`${backendUrl}/api/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-session-id": session || "",
        },
        body: JSON.stringify({
          role: "user",
          content: actualMessage,
          model: {
            provider: "gemini",
            name: model.name,
            isLiveModel: model.isLiveModel,
          },
        }),
      });

      const data = await res.json();
      console.log("[SERVER RESPONSE]:", data);

      if (data.success) {
        addChat({
          role: "assistant",
          content: data.data || data,
        });
        if (data.sessionId) {
          setSession(data.sessionId);
        }
      } else {
        addChat({
          role: "assistant",
          content: {
            lastAIMsg: data.message || "Failed to process message.",
            terminalError: data.data?.terminalError || "Request failed",
          },
        });
      }
    } catch (error: any) {
      console.error("[SEND ERROR]:", error);
      addChat({
        role: "assistant",
        content: {
          lastAIMsg:
            "Encountered a network error connecting to the Nexus server.",
          terminalError: error?.message || "Connection failed",
        },
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="relative w-full max-w-4xl mx-auto px-4 py-3">
        <div className="relative w-fit ml-2 mb-1.5 group">
          <button className="flex items-center gap-2 text-purple-300 hover:text-purple-400 transition">
            <span className="font-mono">{model.name}</span>{" "}
            <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />
          </button>
          {/* Dropdown Menu */}
          <div className="absolute bottom-full left-0 mb-2 w-56 bg-zinc-900 border border-purple-500/30 rounded-xl overflow-hidden shadow-2xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="p-1">
              {Models.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setModel(m)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-left transition-all ${
                    model.name === m.name
                      ? "bg-purple-500/20 text-purple-300"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {m.name}
                  {model.name === m.name && (
                    <CheckCircle2 className="h-4 w-4 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center rounded-2xl bg-zinc-900/90 border border-purple-500/30 p-1.5 shadow-[0_0_25px_rgba(115,87,226,0.15)] focus-within:border-purple-400 focus-within:shadow-[0_0_30px_rgba(115,87,226,0.3)] backdrop-blur-lg transition-all duration-300">
          {/* Left Indicator */}
          {/* <div className="pl-3 pr-2 text-purple-400 select-none">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div> */}

          {/* Input Field */}
          <input
            className="flex-1 bg-transparent px-2 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none tracking-wide"
            type="text"
            placeholder="Ask Nexus to run commands, inspect files, or launch desktop apps... (Press Enter)"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMsg();
              }
            }}
            disabled={isSending}
          />

          {/* Send Button */}
          <button
            onClick={handleSendMsg}
            disabled={isSending || !msg.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/30 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
            title="Send message"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <SendHorizonal className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] text-zinc-400">
          <span>
            Press{" "}
            <kbd className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[10px] text-zinc-300">
              Enter
            </kbd>{" "}
            to send
          </span>
        </div>
      </div>
    </>
  );
};

export default SendMsg;
