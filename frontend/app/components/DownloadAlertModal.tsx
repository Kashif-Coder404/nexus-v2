"use client";

import React from "react";
import { AlertCircle, Download, X } from "lucide-react";
import useData from "../store/useData";

export default function DownloadAlertModal({
  onClose,
}: {
  onClose?: () => void;
}) {
  const isDownloadAlertOpen = useData((state) => state.isDownloadAlertOpen);
  const closeDownloadAlert = useData((state) => state.closeDownloadAlert);
  const localBackendVersion = useData((state) => state.localBackendVersion);

  if (!isDownloadAlertOpen) return null;

  const handleClose = () => {
    closeDownloadAlert();
    if (onClose) onClose();
  };

  const handleDownload = () => {
    handleClose();
    // Direct link to the latest standalone release binary
    window.location.href =
      "https://github.com/Kashif-Coder404/nexus-v2/releases/latest/download/nexus.exe";
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 z-[9999]"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-zinc-900/95 border border-brand-border/70 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-brand/20 text-white flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <h3 className="text-base font-semibold text-white">
              Download Nexus v{localBackendVersion} (Windows)
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong className="text-amber-400 font-medium">Notice:</strong> Because Nexus is a free open-source companion, browsers and Windows Defender may flag the download or mark it as unverified.
            </p>
          </div>
        </div>

        <div className="bg-brand-surface/40 border border-brand-border/40 rounded-xl p-3.5 space-y-2 text-xs text-zinc-300">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-hover shrink-0 mt-1.5" />
            <span><strong>Browser warning:</strong> If Chrome/Edge blocks the file, click &quot;Keep&quot; or &quot;Download unverified file&quot;.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-hover shrink-0 mt-1.5" />
            <span><strong>SmartScreen alert:</strong> Click &quot;More info&quot; &rarr; &quot;Run anyway&quot;.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-hover shrink-0 mt-1.5" />
            <span><strong>Run with Administrator rights:</strong> Required for live hardware sensors (CPU/GPU temps) and background service auto-start.</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-5 py-2.5 bg-gradient-to-r from-brand to-brand-hover hover:brightness-110 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand/30 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Nexus.exe</span>
          </button>
        </div>
      </div>
    </div>
  );
}
