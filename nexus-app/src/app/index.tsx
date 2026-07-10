import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  StatusBar,
} from "react-native";
import ChatInput from "../components/ChatInput";
import ChatBox from "@/components/ChatBox";
import { MessageItems } from "@/components/ChatBox";
import { UserProp } from "@/components/UserBox";
import { AIBoxProps } from "@/components/AiBox";
export default function App() {
  const [message, setMessage] = useState("");
  const [tempMsg, setTempMsg] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const [session, setSession] = useState<string>(
    Date.now().toString(36) + Math.random().toString(36).substring(2),
  );
  const [chatHistory, setChatHistory] = useState<MessageItems[]>([]);

  const handleSend = async () => {
    if (!message) return;
    console.log("Message: ", message);
    setTempMsg(message);
    setMessage("");

    const newMsgId = Date.now().toString();
    const UserChatMsg: UserProp = {
      id: newMsgId,
      role: "user",
      message: message,
      time: Date.now().toString(),
      status: "sending",
    };
    setChatHistory((prev: any) => {
      return [...prev, UserChatMsg];
    });
    const apiKey: any = process.env.EXPO_PUBLIC_NEXUS_API_KEY;
    try {
      const response = await fetch(
        "http://192.168.31.116:3100/api/chat/message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            message: message.toLowerCase(),
            session: session,
          }),
        },
      );

      const data: any = await response.json(); // Parses the response from the server

      // Update the specific message to sent
      setChatHistory((prev: any) => {
        return prev.map((msg: any) =>
          msg.id === newMsgId ? { ...msg, status: "sent" } : msg,
        );
      });

      console.log("Data from the server: ", data);
      const aiResponse: any = data.data;
      const aiMsg: string = aiResponse.lastAIMsg;
      const terminal: string =
        aiResponse.terminal === "success" ? "" : aiResponse.terminal;
      const cmd: string = aiResponse.lastCMD;
      const terminalOutput: string =
        aiResponse.terminalOutpt || aiResponse.terminalError;
      const AIChatMsg: AIBoxProps = {
        id: Date.now().toString(),
        role: "nexus",
        content: {
          AiMsg: aiMsg,
          terminal: terminal,
          terminalOutput: terminalOutput,
          cmd: cmd,
        },
      };
      setChatHistory((prev) => [...prev, AIChatMsg]);
    } catch (error: any) {
      console.error("Error while sending: ", error);
      // Update the specific message to error and add an AI error message
      setChatHistory((prev: any) => {
        return [
          ...prev.map((msg: any) =>
            msg.id === newMsgId ? { ...msg, status: "error" } : msg,
          ),
          {
            id: Date.now().toString(),
            role: "nexus",
            content: {
              AiMsg: "Server is not responding.",
              terminal: "",
              terminalOutput: "",
              cmd: "",
            },
          },
        ];
      });
    } finally {
      setTempMsg("");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <Text style={styles.header}>
        NEXUS <Text style={styles.headerAccent}>CONSOLE</Text>
      </Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {chatHistory.map((item) => (
          <ChatBox key={item.id} item={item} />
        ))}
      </ScrollView>

      <ChatInput
        message={message}
        setMessage={setMessage}
        tempMsg={tempMsg}
        onSend={handleSend}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#0B0F19", // Deep dark space background
  },
  header: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F8FAFC",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 2,
  },
  headerAccent: {
    color: "#2563EB", // Accent blue matching buttons
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
