"use client";
import React, { useEffect } from "react";
import AIMsgBox from "./AIMsgBox";
import UserMsgBox from "./UserMsgBox";
import SendMsg from "./SendMsg";
import useChat from "../store/useChat";
import { Bot } from "lucide-react";
import { useUserCredentials } from "../store/useUserCredentials";
import { useRouter } from "next/navigation";
const ChatUI = () => {
  const chat = useChat((state) => state.chat);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const workingOn = useChat((state) => state.workingOn);
  const user = useUserCredentials.getState().user;
  const router = useRouter();
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [workingOn, chat]);
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user]);
  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden">
      {/* 1. Scrollable Message Feed */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 sm:px-6 py-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {chat.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <img
              src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
              alt="NexusIcon"
              className={`z-10`}
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">
                What is Today Task{" "}
                <span className="text-brand">?</span>{" "}
              </h1>
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
          <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-surface/80 border border-brand-border/50 shadow-[0_0_20px_rgba(168,85,247,0.25)] text-brand-glow max-w-fit animate-pulse">
            <Bot className="h-5 w-5 text-brand-hover animate-spin" />
            <span className="text-sm font-mono text-brand-glow">
              {workingOn}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. Pinned Bottom Input Bar */}
      <div className="shrink-0 w-full backdrop-blur-md py-2">
        <SendMsg />
      </div>
    </div>
  );
};

const style = {
  logoImage: "opacity-50 z-10",
};
export default ChatUI;
