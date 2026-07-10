import { useEffect, useState } from "react";
import { useAppContext } from "../context/provider";
import AIBOX from "./AIBox";
import UserBox from "./UserBox";

const Chat = () => {
  const { isLoading, chatHistory, setChatHistory, msg, setMsg, session } =
    useAppContext();
  const [isSending, setIsSending] = useState(false);
  useEffect(() => {
    console.log(chatHistory);
  }, [chatHistory]);
  const sendMessage = async () => {
    if (!msg) return;
    setIsSending(true);
    setChatHistory((prev: any) => [
      ...prev,
      { id: Date.now(), role: "user", content: msg },
    ]);
    console.log("Sending message: ", msg, "\nSending Session: ", session);
    try {
      const apiKey = import.meta.env.VITE_NEXUS_API_KEY || "";
      const res: any = await fetch("http://localhost:3100/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ message: msg, session: session }),
      });
      const data = await res.json();
      console.log("Response: ", data);
      // lastAIMsg: "connect ECONNREFUSED 127.0.0.1:8082";
      // lastCMD: "";
      // terminal: "Success";
      // terminalError: "";
      const aiResponse = data.data;
      const aiMsg = aiResponse.lastAIMsg;
      const cmd: string = aiResponse.lastCMD;
      const terminal: string = aiResponse.terminal;
      const terminalError: string = aiResponse.terminalError;
      setChatHistory((prev: any) => [
        ...prev,
        {
          role: "nexus",
          content: {
            msg: aiMsg,
            cmd: cmd || "",
            terminal: terminal || "",
            terminalError: terminalError || "",
          },
        },
      ]);
      console.log(chatHistory);
    } catch (error) {
      console.error("Error: ", error);
      setChatHistory((prev: any) => [
        ...prev,
        {
          role: "nexus",
          content: {
            msg: error,
            cmd: "",
            terminal: "",
            terminalError: "",
          },
        },
      ]);
    }
    setMsg("");
    setIsSending(false);
  };
  return (
    <div className="ChatCont">
      <h1>Chat</h1>
      <div className="chat">
        {chatHistory.map((msg: any, index: number) => {
          const key = msg.id || `msg-${index}`;
          if (msg.role === "user") {
            return <UserBox key={key} message={msg.content} />;
          }
          if (msg.role === "nexus") {
            return (
              <AIBOX
                key={key}
                message={msg.content.msg || msg.content.aiMsg}
                cmd={msg.content.cmd}
                terminal={msg.content.terminal}
                terminalError={msg.content.terminalError}
              />
            );
          }
        })}
        {isLoading && chatHistory.length === 0 && (
          <div className="loading">Connecting to server...</div>
        )}
        {isSending && <div className="loading">Nexus is typing...</div>}
      </div>
      <div className="input">
        <input
          type="text"
          className="input-text"
          placeholder={isSending ? "Sending..." : "Message..."}
          value={msg}
          onKeyDown={(e: any) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          onChange={(e: any) => setMsg(e.target.value)}
          disabled={isLoading || isSending}
        />
        <button
          className="send"
          onClick={sendMessage}
          disabled={isLoading || isSending}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chat;
