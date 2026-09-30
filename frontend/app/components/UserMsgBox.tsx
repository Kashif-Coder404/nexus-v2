"use client";
import React, { useEffect, useRef } from "react";
import { User } from "lucide-react";
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
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      ref={userMsgRef}
      className="flex flex-col items-end w-full max-w-120 sm:max-w-xl p-2 ml-auto"
    >
      <div className="pb-2">
        {timestamp && (
          <span className="text-xs text-white/60 font-mono mr-1">
            {timestamp}
          </span>
        )}
      </div>
      <div className="p-3.5 rounded-xl rounded-tr-none text-xl bg-brand-border w-fit shadow-md font-normal leading-relaxed wrap-anywhere">
        {displayMsg}
      </div>
    </motion.div>
  );
};

export default UserMsgBox;
