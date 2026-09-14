"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, MessageSquare, Sliders } from "lucide-react";
import { useSideBar } from "../../store/useSideBar";

export default function SideBarHeader() {
  const { toggleSidebar, isSidebarOpen } = useSideBar();
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between pb-4 w-full">
      <img
        src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
        alt="Nexus Logo"
        className="w-9 h-9 object-contain"
      />

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          onClick={() => isSidebarOpen && toggleSidebar(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            pathname === "/dashboard"
              ? "bg-brand text-white shadow-lg shadow-brand/30 border border-brand-hover/40"
              : "bg-brand-surface/60 border border-brand-border/20 text-zinc-400 hover:text-white hover:bg-brand-surface"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/chat"
          onClick={() => isSidebarOpen && toggleSidebar(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            pathname === "/chat"
              ? "bg-brand text-white shadow-lg shadow-brand/30 border border-brand-hover/40"
              : "bg-brand-surface/60 border border-brand-border/20 text-zinc-400 hover:text-white hover:bg-brand-surface"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </Link>
      </div>

      <button
        onClick={() => toggleSidebar()}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition cursor-pointer"
        aria-label="Close Sidebar"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
    </div>
  );
}
