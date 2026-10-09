"use client";
import React, { useEffect } from "react";
import AIMsgBox from "./AIMsgBox";
import UserMsgBox from "./UserMsgBox";
import SendMsg from "./SendMsg";
import useChat from "../store/useChat";
import { Bot } from "lucide-react";
import { useUserCredentials } from "../store/useUserCredentials";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import ExecutionSteps from "./ExecutionsStep";
import ReactMarkdown from "react-markdown";
const ChatUI = () => {
  const chat = useChat((state) => state.chat);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  // const workingOn = "Testing ui..."; // for ui fixes (TESTING PURPOSE)
  // const middleMsg = "Testing the ai ui message.."; // for ui fixes(TESTING PURPOSE)
  const workingOn = useChat((state) => state.workingOn);
  const middleMsg = useChat((state) => state.middleMsg);
  const user = useUserCredentials((state) => state.user);
  const _hashydrated = useUserCredentials((state) => state._hasHydrated);
  const liveExecutions = useChat((state) => state.liveExecutions);
  const isLoadingChat = useChat((state) => state.isLoadingChat);
  const [liveSeconds, setLiveSeconds] = React.useState(0);

  useEffect(() => {
    if (!workingOn) {
      setLiveSeconds(0);
      return;
    }
    setLiveSeconds(1);
    const interval = setInterval(() => {
      setLiveSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [!!workingOn]);

  const router = useRouter();
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [workingOn, chat]);
  useEffect(() => {
    if (_hashydrated && !user) {
      router.push("/auth/login");
    }
  }, [user, _hashydrated]);
  return (
    <div className="flex flex-col h-full w-full text-white overflow-hidden">
      {/* 1. Scrollable Message Feed */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 sm:px-6 py-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {isLoadingChat ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-16 w-16 rounded-full border border-brand/40 animate-ping" />
              <div className="h-12 w-12 rounded-full border-2 border-brand-border/40 border-t-brand-hover animate-spin" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-sm font-medium text-zinc-200">
                Loading conversation...
              </p>
              <p className="text-xs text-zinc-500">
                Retrieving messages and visual history
              </p>
            </div>
          </div>
        ) : chat.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col items-center justify-center h-full gap-4"
          >
            <img
              src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
              alt="NexusIcon"
              className="w-20 h-20 object-contain opacity-70 drop-shadow-[0_0_24px_rgba(168,85,247,0.5)]"
            />
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                What is Today&apos;s Task{" "}
                <span className="text-brand drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                  ?
                </span>
              </h1>
              <p className="text-xs text-zinc-500">
                Ask Nexus to run commands, inspect files, or launch apps
              </p>
            </div>
          </motion.div>
        ) : (
          chat.map((chMsg, index) => {
            if (chMsg.role === "user") {
              return (
                <UserMsgBox
                  key={index}
                  message={chMsg.content}
                  timestamp={
                    chMsg.timestamp
                      ? new Date(chMsg.timestamp).toLocaleString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""
                  }
                />
              );
            } else {
              return (
                <AIMsgBox
                  key={index}
                  data={chMsg}
                  isLatest={index === chat.length - 1}
                />
              );
            }
          })
        )}
        {/* Unified AI Working State (Middle Message + Live Steps) */}
        <AnimatePresence mode="wait">
          {(middleMsg || workingOn) && (
            <motion.div
              key="ai-working"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-2xl px-2"
            >
              {/* Nexus identity */}
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-border/60 bg-brand-surface/70">
                  <Bot className="h-3.5 w-3.5 text-brand-hover" />
                </div>

                <span className="text-xs font-semibold text-zinc-300">
                  Nexus AI
                </span>

                {middleMsg && (
                  <span className="text-[10px] text-brand-hover/80">
                    In Progress
                  </span>
                )}
              </div>

              {/* AI progress message */}
              {middleMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="
          mb-3
          w-full
          rounded-xl
          rounded-tl-sm
          border border-brand-border/50
          bg-brand-surface/55
          px-3.5 py-3
          text-sm
          leading-6
          text-zinc-200
        "
                >
                  <div className="relative z-10">
                    <ReactMarkdown>{middleMsg}</ReactMarkdown>
                  </div>
                </motion.div>
              )}

              {/* Execution workflow */}
              {workingOn && (
                <ExecutionSteps
                  executions={liveExecutions}
                  isWorking={true}
                  currentWorkingOn={workingOn}
                  workedSeconds={liveSeconds}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* 2. Pinned Bottom Input Bar */}
      <div className="shrink-0 w-full backdrop-blur-md bg-[#080711]/90 py-2">
        <SendMsg />
      </div>
    </div>
  );
};

const style = {
  logoImage: "opacity-50 z-10",
};
export default ChatUI;
