"use client";
import React, { useEffect, useRef } from "react";
import { User } from "lucide-react";

interface UserMsgBoxProps {
  message: string;
  timestamp?: string;
}

const UserMsgBox: React.FC<UserMsgBoxProps> = ({ message, timestamp }) => {
  const userMsgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    userMsgRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [message]);

  return (
    <div
      ref={userMsgRef}
      className="flex flex-col items-end w-full max-w-120 sm:max-w-xl p-2 ml-auto"
    >
      {/* User Header */}
      <div className="flex items-center gap-2 mb-2 flex-row-reverse">
        <div className="text-xs text-zinc-500 font-mono mr-1">
          {new Date().toLocaleString()}
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-hover text-white shadow-sm border border-brand-border/40">
          <User className="h-4 w-4 text-brand-glow" />
        </div>
        <span className="text-sm font-semibold text-white">You</span>
        {timestamp && (
          <span className="text-[11px] text-zinc-500 font-mono mr-1">
            {timestamp}
          </span>
        )}
      </div>

      {/* User Message Bubble */}
      <div className="p-3.5 rounded-xl bg-brand-surface/60 border border-brand-border/40 shadow-md w-full text-base font-normal text-zinc-100 leading-relaxed break-words [overflow-wrap:anywhere]">
        {message}
      </div>
    </div>
  );
};

export default UserMsgBox;
