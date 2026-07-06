import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import ChatInput from "../components/ChatInput";
import ChatMessage, { MessageItem } from "../components/ChatMessage";

export default function App() {
  const [message, setMessage] = useState("");
  const [tempMsg, setTempMsg] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const [session, setSession] = useState<string>(
    Date.now().toString(36) + Math.random().toString(36).substring(2),
  );
  const [chatHistory, setChatHistory] = useState<MessageItem[]>([
    {
      id: "1",
      sender: "AI",
      text: "Hello! I am your AI assistant.",
      status: "sent",
    },
  ]);

  const handleSend = async () => {
    if (!message) return;
    console.log("Message: ", message);
    setTempMsg(message);
    setMessage("");

    const newMsgId = Date.now().toString();
    const toSend = {
      id: newMsgId,
      sender: "user",
      text: message,
      status: "sending",
    };
    setChatHistory((prev) => [...prev, toSend]);

    try {
      const response = await fetch(
        "http://192.168.31.116:3100/api/chat/message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
            session: session,
          }),
        },
      );

      const data: any = await response.json(); // Parses the response from the server

      // Update the specific message to sent
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === newMsgId ? { ...msg, status: "sent" } : msg,
        ),
      );

      console.log("Data from the server: ", data);
      if (data) {
        setChatHistory((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "AI",
            text: data.lastAIMsg || data.reply || "No message received",
            status: "sent",
          },
        ]);
      }
    } catch (error: any) {
      console.log("Error while sending: ", error);
      // Update the specific message to error
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === newMsgId ? { ...msg, status: "error" } : msg,
        ),
      );
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
      <Text style={styles.header}>AI ChatApp</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {chatHistory.map((item) => (
          <ChatMessage key={item.id} item={item} />
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
    paddingTop: 60,
    backgroundColor: "#F0F4F8",
  },
  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#102A43",
    marginBottom: 10,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
