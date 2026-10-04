"use client";

import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const StepTerminal = ({ terminalOutput }: { terminalOutput: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const term = new Terminal({
      disableStdin: true,
      cursorBlink: false,
      convertEol: true,
      fontFamily:
        'Menlo, Monaco, "Cascadia Code", "Fira Code", Consolas, monospace',
      fontSize: 11,
      lineHeight: 1.3,
      theme: {
        background: "#080711", // Matches our sleek Nexus card background
        foreground: "#d4d4d8",
        red: "#f87171",
        green: "#34d399",
        yellow: "#fbbf24",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#22d3ee",
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    termRef.current = term;
    term.parser.registerOscHandler(9, () => true);
    try {
      fitAddon.fit();
    } catch {}
    if (terminalOutput) {
      term.write(terminalOutput);
    }
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {}
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
    };
  }, [terminalOutput]);

  return (
    <div className="w-full max-h-60 overflow-hidden rounded-lg border border-brand-border/20 bg-[#080711] p-2">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default StepTerminal;
