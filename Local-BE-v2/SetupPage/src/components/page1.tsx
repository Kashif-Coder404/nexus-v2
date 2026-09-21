import { Check, Copy, Laptop, LoaderCircle, RefreshCw, Trash2, CheckCircle2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface StatusResponse {
  isConnected: boolean; // Is local agent connected to Cloud?
  isPaired: boolean;    // Is this PC paired or unpaired?
  code?: string;        // The 6-character pairing code (e.g. "A1B2C3")
  remainingSeconds?: number;
}

const PairingPage = () => {
  const [status, setStatus] = useState<StatusResponse | null>({
    isConnected: false,
    isPaired: false,
    code: "",
    remainingSeconds: 0,
  });
  const [codeLoading, setCodeLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:4100/api/pairing-status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Local agent offline
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Local Countdown Timer
  useEffect(() => {
    if (!status?.remainingSeconds || status.remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setStatus((prev) =>
        prev && prev.remainingSeconds && prev.remainingSeconds > 0
          ? { ...prev, remainingSeconds: prev.remainingSeconds - 1 }
          : prev
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [status?.remainingSeconds]);

  const handleRegenerate = async () => {
    setCodeLoading(true);
    try {
      const res = await fetch("http://localhost:4100/api/generate-code", {
        method: "POST",
      });
      const data = await res.json();
      if (data.code) {
        setStatus((prev) =>
          prev ? { ...prev, code: data.code, remainingSeconds: 300 } : null
        );
      }
    } catch (err) {
      console.error("Failed to regenerate code:", err);
    } finally {
      setCodeLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!status?.code) return;
    const fullCode = `NX-${status.code.replaceAll("NX-", "")}`;
    try {
      await navigator.clipboard.writeText(fullCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write error
    }
  };

  const handleUninstall = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect this device from your cloud account? This will clear local authentication tokens."
      )
    ) {
      return;
    }

    setIsRevoking(true);
    try {
      await fetch("http://localhost:4100/api/uninstall", { method: "POST" });
      setStatus((prev) => (prev ? { ...prev, isPaired: false, code: "" } : null));
      alert("Device has been disconnected and revoked.");
    } catch (err) {
      console.error("Failed to uninstall/revoke device:", err);
    } finally {
      setIsRevoking(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-brand-surface/90 border border-brand-border/40 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-6">
      {/* Top Header Bar */}
      <div className="w-full flex justify-between items-center border-b border-brand-border/30 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand/15 border border-brand-border/40 flex items-center justify-center text-brand-hover">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Nexus Companion</h1>
            <span className="text-[10px] text-zinc-500 font-mono">Port 4100</span>
          </div>
        </div>

        <div
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border ${
            status?.isConnected
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status?.isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
            }`}
          />
          {status?.isConnected ? "Cloud Online" : "Cloud Offline"}
        </div>
      </div>

      {/* Main Body State */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-2">
        {status?.isPaired ? (
          /* PAIRED STATE */
          <div className="space-y-4 py-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Device Linked</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                This machine is authenticated and connected to your Nexus cloud account.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleUninstall}
                disabled={isRevoking}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRevoking ? "Revoking..." : "Disconnect & Revoke"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* UNPAIRED / PAIRING CODE STATE */
          <div className="space-y-4 w-full">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Temporary Pairing Code
            </span>

            <div className="text-4xl sm:text-5xl font-mono font-bold tracking-widest text-brand-glow drop-shadow-[0_0_16px_rgba(168,85,247,0.4)]">
              {status?.code ? `NX-${status.code.replaceAll("NX-", "")}` : "NX------"}
            </div>

            <p className="text-[11px] text-zinc-500">
              Enter this code on your Nexus Web App (Devices → Pair New Device).
            </p>

            {/* Action Buttons: Copy & Regenerate */}
            <div className="flex justify-center items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!status?.code || status.code === "------"}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-md shadow-brand/20 transition-all cursor-pointer disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={codeLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-surface border border-brand-border/40 hover:border-brand-hover text-zinc-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${codeLoading ? "animate-spin" : ""}`} />
                <span>{codeLoading ? "Generating..." : "New Code"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between w-full pt-3 border-t border-brand-border/20 text-xs text-zinc-400 font-mono">
        <span>
          {status?.isPaired ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Machine Paired
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-zinc-500">
              <LoaderCircle className="w-3 h-3 animate-spin text-brand" />
              Awaiting pairing...
            </span>
          )}
        </span>

        {!status?.isPaired && status?.remainingSeconds ? (
          <span className="text-[11px] text-zinc-500">
            Expires in: <strong className="text-zinc-300">{formatTime(status.remainingSeconds)}</strong>
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default PairingPage;
