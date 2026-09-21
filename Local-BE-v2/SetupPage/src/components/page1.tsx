import {
  Check,
  Copy,
  Laptop,
  LoaderCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Power,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface StatusResponse {
  isConnected: boolean; // Is local agent connected to Cloud?
  isPaired: boolean;    // Is this PC paired or unpaired?
  isEnable?: boolean;   // Can AI execute commands?
  code?: string;        // The 6-character pairing code (e.g. "A1B2C3")
  remainingSeconds?: number;
  pairingError?: string;
}

const PairingPage = () => {
  const [status, setStatus] = useState<StatusResponse | null>({
    isConnected: false,
    isPaired: false,
    isEnable: true,
    code: "",
    remainingSeconds: 0,
  });
  const [codeLoading, setCodeLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [isStopped, setIsStopped] = useState<boolean>(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:4100/api/pairing-status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Agent offline
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
      // clipboard error
    }
  };

  // Toggle Remote Command Execution Killswitch
  const handleToggleSwitch = async () => {
    if (isToggling) return;
    const nextState = !status?.isEnable;
    setIsToggling(true);
    try {
      await fetch("http://localhost:4100/switch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: nextState }),
      });
      setStatus((prev) => (prev ? { ...prev, isEnable: nextState } : null));
    } catch (err) {
      console.error("Failed to toggle switch:", err);
    } finally {
      setIsToggling(false);
    }
  };

  // Stop Server (Graceful Shutdown)
  const handleStopServer = async () => {
    if (!confirm("Stop the Nexus background agent?")) return;
    try {
      await fetch("http://localhost:4100/api/stop-server", { method: "POST" });
      setIsStopped(true);
    } catch {
      setIsStopped(true);
    }
  };

  // Disconnect & Revoke
  const handleUninstall = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect this device from your cloud account? Stored tokens will be removed."
      )
    ) {
      return;
    }

    setIsRevoking(true);
    try {
      await fetch("http://localhost:4100/api/uninstall", { method: "POST" });
      setStatus((prev) => (prev ? { ...prev, isPaired: false, code: "" } : null));
      alert("Device unlinked successfully.");
    } catch (err) {
      console.error("Failed to revoke device:", err);
    } finally {
      setIsRevoking(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // STOPPED VIEW
  if (isStopped) {
    return (
      <div className="w-full max-w-sm p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
          <Power className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-white">Agent Stopped</h2>
        <p className="text-xs text-zinc-400">
          The background agent on port 4100 has been shut down. Restart the application to reconnect.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col space-y-5 text-white">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-purple-400">
            <Laptop className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Nexus Companion</h1>
            <span className="text-[11px] text-zinc-500 font-mono">Port 4100</span>
          </div>
        </div>

        <div
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 border ${
            status?.isConnected
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status?.isConnected ? "bg-emerald-400" : "bg-rose-400"
            }`}
          />
          {status?.isConnected ? "Cloud Online" : "Cloud Offline"}
        </div>
      </div>

      {/* Error Alert */}
      {status?.pairingError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{status.pairingError}</span>
        </div>
      )}

      {/* ───────────────── PAIRED STATE ───────────────── */}
      {status?.isPaired ? (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-left">
              <h2 className="text-sm font-semibold text-emerald-300">Device Linked & Ready</h2>
              <p className="text-xs text-emerald-400/80">
                Connected and authenticated with your cloud account.
              </p>
            </div>
          </div>

          {/* Killswitch Control Row */}
          <div className="p-3.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between">
            <div className="space-y-0.5 text-left">
              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Remote Command Execution
              </div>
              <p className="text-[11px] text-zinc-400">
                {status?.isEnable
                  ? "Allowed: commands execute automatically."
                  : "Paused: incoming commands will be rejected."}
              </p>
            </div>

            {/* Clean toggle switch */}
            <button
              type="button"
              onClick={handleToggleSwitch}
              disabled={isToggling}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                status?.isEnable ? "bg-purple-600" : "bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  status?.isEnable ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Action Buttons: Stop & Revoke */}
          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleStopServer}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition"
            >
              <Power className="w-3.5 h-3.5 text-zinc-400" />
              <span>Stop Agent</span>
            </button>

            <button
              type="button"
              onClick={handleUninstall}
              disabled={isRevoking}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium border border-rose-500/30 transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{isRevoking ? "Revoking..." : "Disconnect"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* ───────────────── UNPAIRED STATE ───────────────── */
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-zinc-800/40 border border-zinc-800 text-center space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Temporary Pairing Code
            </span>

            <div className="text-4xl sm:text-5xl font-mono font-bold tracking-widest text-purple-300 py-1">
              {status?.code ? `NX-${status.code.replaceAll("NX-", "")}` : "NX------"}
            </div>

            {status?.remainingSeconds ? (
              <p className="text-[11px] text-zinc-400 font-mono">
                Expires in {formatTime(status.remainingSeconds)}
              </p>
            ) : null}
          </div>

          {/* Buttons: Copy & Regenerate */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!status?.code || status.code === "------"}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={codeLoading}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${codeLoading ? "animate-spin" : ""}`} />
              <span>{codeLoading ? "..." : "New Code"}</span>
            </button>
          </div>

          {/* 3 Step Instruction Guide */}
          <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/80 text-left space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">
              How to link this machine:
            </span>
            <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-400">
              <li>Open Nexus web app on your phone or browser.</li>
              <li>Go to <strong className="text-zinc-200">Devices</strong> → <strong className="text-zinc-200">Pair New Device</strong>.</li>
              <li>Enter the code above to finish linking.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
        <span>
          {status?.isPaired ? (
            <span className="text-emerald-400">● Ready for commands</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <LoaderCircle className="w-3 h-3 animate-spin text-purple-400" />
              Awaiting pairing...
            </span>
          )}
        </span>
        <span>v2.5.3</span>
      </div>
    </div>
  );
};

export default PairingPage;
