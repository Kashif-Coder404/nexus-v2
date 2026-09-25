"use client";
import React, { useEffect } from "react";
import AIMsgBox from "./AIMsgBox";
import UserMsgBox from "./UserMsgBox";
import SendMsg from "./SendMsg";
import useChat from "../store/useChat";
import { Bot } from "lucide-react";
import { useUserCredentials } from "../store/useUserCredentials";
import { useRouter } from "next/navigation";
import ExecutionSteps from "./ExecutionsStep";
const ChatUI = () => {
  const chat = useChat((state) => state.chat);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const workingOn = useChat((state) => state.workingOn);
  // const workingOn = "Testing ui..."; //for ui fixes
  const user = useUserCredentials.getState().user;
  const liveExecutions = useChat((state) => state.liveExecutions);
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
    if (!user) {
      router.push("/auth/login");
    }
  }, [user]);
  return (
    <div className="flex flex-col h-full w-full text-white overflow-hidden">
      {/* 1. Scrollable Message Feed */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 sm:px-6 py-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {chat.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <img
              src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
              alt="NexusIcon"
              className={`z-10`}
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">
                What is Today Task <span className="text-brand">?</span>{" "}
              </h1>
            </div>
          </div>
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
              return <AIMsgBox key={index} data={chMsg.content} />;
            }
          })
        )}
        {workingOn && (
          <div className="flex flex-col items-start w-full max-w-2xl px-2">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-8 w-8 text-brand-hover p-1.5 bg-brand-surface/80 rounded-lg border border-brand-border/40" />
              <span className="text-xs font-semibold text-zinc-300">
                Nexus AI
              </span>
            </div>
            <ExecutionSteps
              executions={liveExecutions}
              isWorking={true}
              currentWorkingOn={workingOn}
              workedSeconds={liveSeconds}
            />
          </div>
        )}
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
