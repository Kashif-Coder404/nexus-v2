"use client";
import React, { useEffect } from "react";
import AIMsgBox from "./AIMsgBox";
import AIMsg from "./AIMsg";
import UserMsgBox from "./UserMsgBox";
import SendMsg from "./SendMsg";
import useChat from "../store/useChat";
import { Bot } from "lucide-react";

const ChatUI = () => {
  const chat = useChat((state) => state.chat);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const workingOn = useChat((state) => state.workingOn);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [workingOn, chat]);

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-white overflow-hidden">
      {/* 1. Scrollable Message Feed */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 sm:px-6 py-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {chat.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <img
              src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
              alt="NexusIcon"
              className={`${style.logoImage}`}
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">What is Today Task? </h1>
            </div>
          </div>
        ) : (
          chat.map((chMsg, index) => {
            if (chMsg.role === "user") {
              return <UserMsgBox key={index} message={chMsg.content} />;
            } else {
              return <AIMsgBox key={index} data={chMsg.content} />;
            }
          })
        )}
        {workingOn && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 shadow-[0_0_20px_rgba(147,51,234,0.2)] text-purple-200 max-w-fit animate-pulse">
            <Bot className="h-5 w-5 text-purple-400 animate-spin" />
            <span className="text-sm font-mono text-purple-100">
              {workingOn}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. Pinned Bottom Input Bar */}
      <div className="shrink-0 w-full border-t border-purple-500/10 bg-zinc-950/90 backdrop-blur-md py-2">
        <SendMsg />
      </div>
    </div>
  );
};

const style = {
  logoImage: "opacity-50 z-10",
};
export default ChatUI;
