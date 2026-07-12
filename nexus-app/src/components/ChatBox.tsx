import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  Text,
} from "react-native";
import UserBox, { UserProp } from "./UserBox";
import AiBox, { AIBoxProps } from "./AiBox";
import { MessageItems, useAppContext } from "@/context/provider";
import initWebsocket from "../../services/websocket.service";

const ChatBox = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    chatHistory,
    setChatHistory,
    messageID,
    setIsWorkingOn,
    isWorkingOn,
  } = useAppContext();

  const messageIDRef = useRef(messageID);
  useEffect(() => {
    messageIDRef.current = messageID;
  }, [messageID]);

  useEffect(() => {
    const socket: WebSocket = initWebsocket();

    socket.onmessage = (event: any) => {
      const data = JSON.parse(event.data);
      console.log("Broadcast data; ", data);
      if (data.status === "received") {
        setChatHistory((prev: MessageItems[]) => {
          return prev.map((msg) =>
            msg.id === messageIDRef.current && msg.role === "user"
              ? ({ ...msg, status: "sent" } as UserProp)
              : msg,
          );
        });
      }
      if (data.type === "ai_data") {
        setIsWorkingOn(data.data.workingon);
      }
      if (data.type === "ai_done") {
        setIsWorkingOn("");
      }
    };
    return () => {
      socket.close();
    };
  }, []);

  const workingBOX = (
    <View style={styles.mainBox}>
      <View style={styles.box}>
        <Text style={styles.roleText}>Nexus</Text>
        <View style={styles.workingCont}>
          <ActivityIndicator
            size="small"
            color="#38BDF8"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.workingText}>{isWorkingOn}...</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      ref={scrollViewRef}
      onContentSizeChange={() => {
        if (
          scrollViewRef.current &&
          typeof scrollViewRef.current.scrollToEnd === "function"
        ) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }}
      onLayout={() => {
        if (
          scrollViewRef.current &&
          typeof scrollViewRef.current.scrollToEnd === "function"
        ) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }}
    >
      {chatHistory.map((item) => (
        <View key={item.id} style={styles.container}>
          {item.role === "user" ? (
            <UserBox {...(item as UserProp)} />
          ) : (
            <AiBox {...(item as AIBoxProps)} />
          )}
        </View>
      ))}
      {isWorkingOn ? <View style={styles.container}>{workingBOX}</View> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 2,
  },
  mainBox: {
    alignSelf: "flex-start",
    maxWidth: "90%",
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  box: {
    backgroundColor: "#1E293B", // Dark slate background
    borderTopLeftRadius: 4, // Chat bubble tail
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#94A3B8",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  workingCont: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  workingText: {
    color: "#94A3B8",
    fontSize: 14,
    fontStyle: "italic",
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

export default ChatBox;
