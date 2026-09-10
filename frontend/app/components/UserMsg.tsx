"use client";
import React from "react";
import { User } from "lucide-react";

interface UserMsgProps {
  message: string;
  timestamp?: string;
}

const UserMsg: React.FC<UserMsgProps> = ({ message, timestamp }) => {
  return (
    <div className="flex w-full justify-end my-3">
      <div className="flex max-w-[85%] sm:max-w-[75%] items-start gap-3 flex-row-reverse">
        {/* User Avatar */}
        <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-md shadow-purple-950/40 border border-purple-400/30">
          <User className="h-5 w-5" />
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col items-end gap-1">
          <div className="rounded-2xl rounded-tr-sm bg-gradient-to-r from-purple-950/80 to-purple-900/50 border border-purple-500/30 px-4 py-3 text-white shadow-lg backdrop-blur-sm">
            <p className="whitespace-pre-wrap text-sm leading-relaxed tracking-wide text-zinc-100 font-normal">
              {message}
            </p>
          </div>
          {timestamp && (
            <span className="text-[11px] text-zinc-400 px-1">{timestamp}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMsg;
