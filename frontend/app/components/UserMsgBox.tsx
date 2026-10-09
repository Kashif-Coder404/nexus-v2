"use client";
import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

interface UserMsgBoxProps {
  message: string;
  timestamp?: string;
}

const UserMsgBox: React.FC<UserMsgBoxProps> = ({ message, timestamp }) => {
  const userMsgRef = useRef<HTMLDivElement>(null);

  const displayMsg =
    typeof message === "string"
      ? message
      : typeof message === "object"
        ? JSON.stringify(message, null, 2)
        : String(message || "");

  useEffect(() => {
    userMsgRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [displayMsg]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      ref={userMsgRef}
      className="flex flex-col items-end w-full max-w-lg sm:max-w-xl px-2 py-1 ml-auto"
    >
      {timestamp && (
        <span className="text-[11px] text-zinc-500 font-mono mb-1.5 mr-1">
          {timestamp}
        </span>
      )}
      <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-linear-to-br from-brand-hover/30 to-brand-hover/0 border border-brand-border/40 text-xl leading-7 text-white font-normal shadow-[0_4px_20px_rgba(168,85,247,0.15)] backdrop-blur-sm break-words [overflow-wrap:anywhere]">
        {displayMsg}
      </div>
    </motion.div>
  );
};

export default UserMsgBox;
