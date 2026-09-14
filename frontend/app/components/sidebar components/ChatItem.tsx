"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import Chats from "../Chats";

export interface ChatContent {
  id: string;
  title: string;
  date: string;
}

interface ChatItemProps {
  data: ChatContent;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ChatItem({
  data,
  isActive,
  onSelect,
  onDelete,
}: ChatItemProps) {
  return (
    <Chats
      onClick={() => onSelect(data.id)}
      className={`flex justify-between items-center group cursor-pointer p-2 w-full transition-all duration-150 rounded-xl border ${
        isActive
          ? "bg-brand/20 border-brand-border/60 shadow-sm shadow-brand/15 text-white"
          : "border-transparent hover:bg-brand/10 hover:border-brand-border/30 text-zinc-300 hover:text-white"
      }`}
    >
      <span
        className="text-start text-sm md:text-base font-medium truncate max-w-[140px] sm:max-w-[160px]"
        title={data.title}
      >
        {data.title}
      </span>
      <div className="flex items-center shrink-0">
        <span className="text-brand-glow/60 text-xs shrink-0 transition-colors group-hover:text-brand-glow/90">
          {data.date}
        </span>
        <div className="md:w-0 md:opacity-0 w-7 group-hover:w-7 group-hover:opacity-100 group-hover:ml-1.5 overflow-hidden transition-all duration-200 ease-out flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(data.id);
            }}
            className="shrink-0 p-1.5 text-zinc-400 hover:text-rose-400 cursor-pointer transition-colors"
            title="Delete chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Chats>
  );
}
