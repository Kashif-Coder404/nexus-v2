"use client";

import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface XTerminalProps {
  taskId: string;
  localBeUrl?: string;
  logs?: string;
  isCompleted?: boolean;
}

export default function XTerminal({
  taskId,
  localBeUrl = "http://localhost:4100",
  logs = "",
  isCompleted = false,
}: XTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastWrittenLength = useRef<number>(0);

  // 1. Mount Terminal & Handlers
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: !isCompleted,
      disableStdin: isCompleted,
      convertEol: true,
      fontFamily:
        'Menlo, Monaco, "Cascadia Code", "Fira Code", Consolas, monospace',
      fontSize: 12,
      lineHeight: 1.25,
      theme: {
        background: "#080711",
        foreground: "#d4d4d8",
        cursor: "#a855f7",
        cursorAccent: "#080711",
        selectionBackground: "rgba(168, 85, 247, 0.35)",
        black: "#18181b",
        red: "#ef4444",
        green: "#10b981",
        yellow: "#f59e0b",
        blue: "#3b82f6",
        magenta: "#c084fc",
        cyan: "#06b6d4",
        white: "#f4f4f5",
        brightBlack: "#71717a",
        brightRed: "#f87171",
        brightGreen: "#34d399",
        brightYellow: "#fbbf24",
        brightBlue: "#60a5fa",
        brightMagenta: "#d8b4fe",
        brightCyan: "#22d3ee",
        brightWhite: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    term.onBell(() => {}); // Explicitly prevent any audio trigger
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    try {
      fitAddon.fit();
    } catch {}

    // Reset length tracking on mount
    lastWrittenLength.current = 0;
    if (logs) {
      term.write(logs);
      lastWrittenLength.current = logs.length;
    }

    // Capture raw keystrokes (Enter, letters, arrows, Ctrl+C) and send to Local-BE
    const onDataDisposable = term.onData(async (data) => {
      if (isCompleted) return;
      try {
        await fetch(`${localBeUrl}/api/tasks/${taskId}/stdin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: data, isRaw: true }),
        });
      } catch (err) {
        console.error("[XTerminal] Failed to send stdin:", err);
      }
    });

    // Listen to live WebSocket chunks from backend if active
    const handleWsMessage = (event: any) => {
      const payload = event.detail;
      if (!payload) return;

      if (payload.type === "cmd_chunk" && payload.taskId === taskId) {
        if (payload.chunk) {
          term.write(payload.chunk);
        }
      } else if (
        payload.type === "task_finished" &&
        payload.taskId === taskId
      ) {
        term.options.cursorBlink = false;
        term.options.disableStdin = true;
      }
    };

    window.addEventListener("nexus_ws_message", handleWsMessage);

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {}
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      onDataDisposable.dispose();
      window.removeEventListener("nexus_ws_message", handleWsMessage);
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
    };
  }, [taskId, localBeUrl, isCompleted]);

  // 2. React to live logs updates (from HTTP polling or state changes)
  useEffect(() => {
    if (!termRef.current) return;
    const current = logs || "";

    if (current.length < lastWrittenLength.current) {
      termRef.current.reset();
      lastWrittenLength.current = 0;
    }

    if (current.length > lastWrittenLength.current) {
      const delta = current.slice(lastWrittenLength.current);
      termRef.current.write(delta);
      lastWrittenLength.current = current.length;
    }
  }, [logs]);

  return (
    <div
      onClick={() => termRef.current?.focus()}
      className="relative w-full h-full min-h-[350px] flex-1 bg-[#080711] overflow-hidden rounded-md border border-[#4c227b]/20 cursor-text"
    >
      <div ref={containerRef} className="w-full h-full p-2" />
    </div>
  );
}
