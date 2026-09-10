"use client";
import React, { useEffect } from "react";
import AIMsgBox from "./AIMsgBox";
import AIMsg from "./AIMsg";
import UserMsgBox from "./UserMsgBox";
import SendMsg from "./SendMsg";
import useChat from "../store/useChat";

const ChatUI = () => {
  const chat = useChat((state) => state.chat);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]); 

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-white overflow-hidden">
      {/* 1. Scrollable Message Feed */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 sm:px-6 py-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {chat.map((chMsg, index) => {
          if (chMsg.role === "user") {
            return <UserMsgBox key={index} message={chMsg.content} />;
          } else {
            return <AIMsgBox key={index} data={chMsg.content} />;
          }
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. Pinned Bottom Input Bar */}
      <div className="shrink-0 w-full border-t border-purple-500/10 bg-zinc-950/90 backdrop-blur-md py-2">
        <SendMsg />
      </div>
    </div>
  );
};

export default ChatUI;
