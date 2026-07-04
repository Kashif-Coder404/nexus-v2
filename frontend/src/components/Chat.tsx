import { useState } from "react";
import { useAppContext } from "../context/provider";
import AIBOX from "./AIBox";
import UserBox from "./UserBox";

const Chat = () => {
  const { isLoading, chatHistory, setChatHistory, msg, setMsg, session } =
    useAppContext();
  const [isSending, setIsSending] = useState(false);
  const sendMessage = async () => {
    if (!msg) return;
    setIsSending(true);
    setChatHistory((prev: any) => [
      ...prev,
      { id: Date.now(), role: "user", content: msg },
    ]);
    console.log("Sending message: ", msg, "\nSending Session: ", session);
    const res: any = await fetch("http://localhost:3100/api/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: msg, session: session }),
    });
    const data = await res.json();
    console.log("Response: ", data);
    //Example:
    // {
    // lastAIMsg: 'stream has been aborted',
    // lastCMD: '',
    // terminal: 'Success',
    // terminalError: ''
    // }
    const aiMsg = data.lastAIMsg;
    const cmd: string = data.lastCMD;
    const terminal: string = data.terminal;
    const terminalError: string = data.terminalError;
    setChatHistory((prev: any) => [
      ...prev,
      {
        role: "Nexus",
        content: {
          msg: aiMsg,
          cmd: cmd || "",
          terminal: terminal || "",
          terminalError: terminalError || "",
        },
      },
    ]);
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
          if (msg.role === "Nexus") {
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
        {isLoading && <div className="loading">Nexus is typing...</div>}
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
