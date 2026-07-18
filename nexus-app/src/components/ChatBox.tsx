import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  Text,
} from "react-native";
import UserBox from "./UserBox";
import AiBox from "./AiBox";
import { useAppContext } from "@/context/provider"; // from chats.ts!
import initWebsocket from "../../services/websocket.service";
import { AIBoxProps, MessageItems, UserProp } from "@/types/chat";

const ChatBox = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    chatHistory,
    setChatHistory,
    messageID,
    setIsWorkingOn,
    isWorkingOn,
    isResponsed,
  } = useAppContext();

  const messageIDRef = useRef(messageID);
  useEffect(() => {
    messageIDRef.current = messageID;
  }, [messageID]);

  useEffect(() => {
    const connect = () => {
      const socket: WebSocket = initWebsocket();
      let reconnectTimeout: NodeJS.Timeout;
      let isComponentMounted = true;
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
      socket.onclose = (event: any) => {
        console.log("Retrying to connect websocket...");
        if (!event.wasClean && isComponentMounted) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
      return () => {
        isComponentMounted = false;
        clearTimeout(reconnectTimeout);
        if (socket) {
          socket.close();
        }
      };
    };
    connect();
  }, []);

  const isError = /fail|error/i.test(isWorkingOn);
  const isSuccess = /success/i.test(isWorkingOn);
  const hideSpinner = isError || isSuccess || /authenticate/i.test(isWorkingOn);

  const showLoading = isWorkingOn !== "" || !isResponsed;
  const statusText = isWorkingOn || "Thinking";

  const workingBOX = (
      <View style={styles.box}>
        <Text style={styles.roleText}>Nexus</Text>
        <View style={styles.workingCont}>
          {!hideSpinner && (
            <ActivityIndicator
              size="small"
              color="#38BDF8"
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.workingText,
              isError && styles.errorText,
              isSuccess && styles.successText,
            ]}
          >
            {statusText}...
          </Text>
        </View>
      </View>
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
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
      {showLoading ? (
        <View style={styles.mainBox}>
          {workingBOX}
        </View>
      ) : null}
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
  errorText: {
    color: "#F87171", // Soft vibrant red
    fontWeight: "bold",
    fontStyle: "normal",
  },
  successText: {
    color: "#4ADE80", // Soft vibrant green
    fontWeight: "bold",
    fontStyle: "normal",
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
    paddingBottom: 60,
  },
});

export default ChatBox;
