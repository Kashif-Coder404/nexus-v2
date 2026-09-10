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
      className="flex flex-col items-end w-full max-w-120 p-2 ml-auto"
    >
      {/* User Header */}
      <div className="flex items-center gap-2 mb-2 flex-row-reverse">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow border border-purple-400/30">
          <User className="h-4 w-4 text-purple-100" />
        </div>
        <span className="text-sm font-semibold text-white">You</span>
        {timestamp && (
          <span className="text-[11px] text-zinc-500 font-mono mr-1">
            {timestamp}
          </span>
        )}
      </div>

      {/* User Message Bubble */}
      <div className="p-3.5 rounded-xl bg-purple-900/30 border border-purple-500/30 shadow-md w-full text-base font-normal text-zinc-100 leading-relaxed break-words">
        {message}
      </div>
    </div>
  );
};

export default UserMsgBox;
