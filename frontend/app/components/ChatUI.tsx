"use client";
import React, { useEffect } from "react";
import AIMsgBox from "./AIMsgBox";
import AIMsg from "./AIMsg";
import UserMsgBox from "./UserMsgBox";
import SendMsg from "./SendMsg";
import useChat from "../store/useChat";

const ChatUI = () => {
  const temp = {
    data: {
      executions: [
        {
          action: "in_built",
          cmd: JSON.stringify({
            action: "in_built",
            param: "echo hello world",
          }),
          exitCode: "0",
          isSuccess: true,
          msg: "Running the first command now...",
          steps: 1,
          terminalError: "",
          terminalOutput: "hello world\r\n",
        },
        {
          action: "in_built",
          cmd: JSON.stringify({
            action: "in_built",
            param: { alias: "code", category: "application" },
          }),
          exitCode: "0",
          isSuccess: true,
          msg: "That one's done! Running the second command...",
          steps: 2,
          terminalError: "",
          terminalOutput: "kashif is great\r\n",
        },
        {
          action: "in_built",
          cmd: JSON.stringify({
            action: "in_built",
            param: "echo nexus ai is working",
          }),
          exitCode: "0",
          isSuccess: true,
          msg: "And now for the final one! 😄",
          steps: 3,
          terminalError: "",
          terminalOutput: "nexus ai is working\r\n",
        },
      ],
      imageBase64: "",
      lastAIMsg:
        "All three commands have been successfully executed separately! 🎉",
      lastCMD: JSON.stringify({
        action: "in_built",
        param: "echo nexus ai is working",
      }),
      terminal:
        "hello world\r\n\nkashif is great\r\n\nnexus ai is working\r\n\n",
      terminalError: "",
    },
    message: "Chat message processed successfully",
    sessionId: "6aa234d0b252fdbb52605be2",
    success: true,
  };
  const chat = useChat((state) => state.chat);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-white overflow-hidden">
      {/* 1. Scrollable Message Feed */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 sm:px-6 py-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {/* <AIMsgBox data={temp.data} /> */}
        {chat.map((chMsg, index) => {
          if (chMsg.role === "user") {
            return <UserMsgBox key={index} message={chMsg.content} />;
          } else {
            return <AIMsgBox key={index} data={chMsg.content} />;
          }
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. Pinned Bottom Input Bar */}
      <div className="shrink-0 w-full border-t border-purple-500/10 bg-zinc-950/90 backdrop-blur-md py-2">
        <SendMsg />
      </div>
    </div>
  );
};

export default ChatUI;
