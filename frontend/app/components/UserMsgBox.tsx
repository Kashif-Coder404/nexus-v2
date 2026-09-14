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

      {/* <div className="flex items-center gap-2 mb-2 flex-row">
        {timestamp && (
          <span className="text-xs text-zinc-500 font-mono mr-1">
            {timestamp}
          </span>
        )}
        <User className="h-6 w-6 text-brand-glow" />

        <span className="text-sm font-semibold text-white">You</span>
      </div> */}

      {/* User Message Bubble */}
      <div className="pb-2">
        {timestamp && (
          <span className="text-xs text-white/60 font-mono mr-1">
            {timestamp}
          </span>
        )}
      </div>
      <div className="p-3.5 rounded-xl rounded-tr-none text-xl bg-brand-border  text-end w-fit shadow-md font-normal leading-relaxed wrap-anywhere">
        {message}
      </div>
    </div>
  );
};

export default UserMsgBox;
