"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  Copy,
  Check,
  Terminal,
  Cpu,
  Search,
  Zap,
} from "lucide-react";
import { useUserCredentials } from "../store/useUserCredentials";

export default function Home() {
  const user = useUserCredentials((state) => state.user);
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText("nexus --start-server");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Subtle Background Accent */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Two-Column or Centered Hero */}
      <main className="flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl mx-auto gap-12 lg:gap-16">
        
        {/* Left Side: Text & Actions */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1 max-w-xl">
          
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30 text-xs font-medium text-purple-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Nexus v2.5.3 • Windows Companion</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Stop Chatting. <br />
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-500 bg-clip-text text-transparent">
              Put Things to Work.
            </span>
          </h1>

          {/* Description */}
          <p className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Control your Windows PC from anywhere using natural language. Run local
            commands, search files in milliseconds, and monitor system vitals from a clean web console.
          </p>

          {/* Example prompt pills */}
          <div className="mt-5 flex flex-wrap gap-2 justify-center lg:justify-start">
            <span className="text-xs px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
              ⚡ "Check CPU & GPU temps"
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
              📁 "Find PDFs on Desktop"
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
              🎵 "Open Spotify"
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-8 justify-center lg:justify-start">
            <Link
              href={user ? `/dashboard` : `/auth/signup`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-950/60 cursor-pointer"
            >
              <span>{user ? "Open Dashboard" : "Get Started"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="https://github.com/Kashif-Coder404/nexus-v2/releases"
              target="_blank"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-sm font-semibold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Download .exe</span>
            </a>
          </div>

          {/* Quick CLI command */}
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-zinc-800 text-xs font-mono text-zinc-400">
            <span className="text-purple-400">$</span>
            <span>nexus --start-server</span>
            <button
              onClick={copyCommand}
              className="p-1 hover:text-white transition-colors cursor-pointer ml-1"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Right Side: Real App Screenshot in a Polished Window Frame */}
        <div className="w-full flex-1 max-w-xl lg:max-w-2xl flex flex-col rounded-2xl border border-purple-500/20 bg-zinc-950/60 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* App Window Top Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/50">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-zinc-500">Nexus Web Console</span>
            <div className="w-10" />
          </div>

          {/* Real App Screenshot */}
          <div className="p-2 bg-black/40">
            <img
              src="https://i.ibb.co/LXdJ74yJ/Screenshot-2026-09-12-202908.png"
              alt="Nexus Dashboard Preview"
              className="w-full h-auto object-cover rounded-lg border border-zinc-800/50 shadow-inner"
            />
          </div>
        </div>

      </main>

      {/* 3 Real Feature Highlights (Not fake stats) */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-5xl">
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-left">
          <Terminal className="w-5 h-5 text-purple-400 mb-2" />
          <h2 className="text-sm font-semibold text-zinc-200">Local Execution Engine</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Runs commands safely on your local machine with instant process control and zero cloud latency.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-left">
          <Search className="w-5 h-5 text-purple-400 mb-2" />
          <h2 className="text-sm font-semibold text-zinc-200">Everything File Search</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Sub-second desktop file indexing to locate and interact with your files right from chat.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-left">
          <Cpu className="w-5 h-5 text-purple-400 mb-2" />
          <h2 className="text-sm font-semibold text-zinc-200">Hardware Telemetry</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time CPU, GPU, temperature, and memory vitals powered by native sensors.
          </p>
        </div>
      </div>
    </div>
  );
}
