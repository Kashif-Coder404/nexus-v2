"use client";

import React, { useState, useEffect } from "react";
import { useDevices } from "../store/useDevices";
import { useUserCredentials } from "../store/useUserCredentials";
import {
  Laptop,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Download,
} from "lucide-react";
const WindowAlert = ({
  setWindowAlert,
}: {
  setWindowAlert: (val: boolean) => void;
}) => {
  const realNexusDownloadHandler = () => {
    setWindowAlert(false);
    window.location.href =
      "https://github.com/Kashif-Coder404/nexus-v2/releases/latest/download/nexus.exe";
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 z-999">
      <div className=" relative w-full flex flex-col p-2 justify-center items-center gap-2">
        <button
          onClick={() => setWindowAlert(false)}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col justify-center items-center gap-2 md:flex-row">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-lg sm:text-base text-red-300">
            <span className=" text-red-500 text-xl font-medium">Note:</span>{" "}
            Since it was free . Window defender can mark it as a trojan . It's
            safe . No worries . Don't believe window defender click more info
            and run anyway.
          </span>
        </div>
        <button
          onClick={realNexusDownloadHandler}
          className="px-3 py-1.5 bg-blue-950/50 hover:bg-blue-900/70 transition-colors border border-blue-500/40 text-blue-300 text-md rounded-lg font-medium flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> Download Nexus
        </button>
      </div>
    </div>
  );
};
const PairDevice = ({
  setWindowAlert,
}: {
  setWindowAlert: (val: boolean) => void;
}) => {
  const { isPairModalOpen, closePairModal } = useDevices();
  const token = useUserCredentials((state) => state.token);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPairModalOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPairModalOpen]);

  if (!isPairModalOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    setCode("");
    setError(null);
    setSuccess(null);
    closePairModal();
  };

  const handlePairing = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError("Please enter a valid pairing code.");
      return;
    }

    if (!token) {
      setError("You must be logged in to pair a device.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://nexus-v2-e38m.onrender.com";

      const res = await fetch(`${backendUrl}/api/pairrequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pairingcode: cleanCode }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || "Device paired successfully!");
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setError(
          data.message ||
            "Pairing failed. Please check the code and ensure your local device is running.",
        );
      }
    } catch (err: any) {
      console.error("[PAIRING ERROR]:", err);
      setError(
        "Could not reach the server. Please check your network connection.",
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleDownloadNexus = () => {
    setWindowAlert(true);
  };
  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-950/95 border border-purple-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-purple-950/50 text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-3 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <Laptop className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Link Companion Device
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xs">
            Make sure your local Nexus is running and open the page{" "}
            <a
              href="http://localhost:4100"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline inline-flex items-center gap-0.5"
            >
              localhost:4100 <ExternalLink className="w-3 h-3 inline" />
            </a>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Pairing Form */}
        <form onSubmit={handlePairing} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pairing-code"
              className="text-xs font-semibold text-zinc-400 uppercase tracking-wider"
            >
              Pairing Code
            </label>
            <input
              id="pairing-code"
              type="text"
              autoFocus
              disabled={isLoading || Boolean(success)}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="e.g. NX-AB12"
              maxLength={12}
              autoComplete="off"
              className="w-full bg-zinc-900/90 border border-purple-500/40 rounded-xl px-4 py-3 text-center text-lg sm:text-xl font-mono font-bold tracking-widest text-white placeholder-zinc-600 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !code.trim() || Boolean(success)}
            className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Pairing Device...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected!</span>
              </>
            ) : (
              <span>Pair Device</span>
            )}
          </button>
        </form>

        {/* Footer Hint & Companion Download */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-zinc-900/60 border border-purple-500/20 rounded-xl p-3">
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-zinc-200">
                Need the companion app?
              </span>
              <span className="text-[11px] text-zinc-400">
                Run it on your PC to get your pairing code.
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadNexus}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>nexus.exe (v2.5.0)</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed text-center">
            Once installed, open{" "}
            <span className="font-mono text-purple-300">
              http://localhost:4100
            </span>{" "}
            to retrieve your code.
          </p>
        </div>
      </div>
    </div>
  );
};

export { PairDevice, WindowAlert };
