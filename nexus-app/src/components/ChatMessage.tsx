import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type MessageItem = {
  id: string;
  sender: string;
  text: string;
  status?: string;
};

type ChatMessageProps = {
  item: MessageItem;
};

export default function ChatMessage({ item }: ChatMessageProps) {
  const isUser = item.sender === "user";
  return (
    <View
      style={[
        styles.messageWrapper,
        isUser ? styles.messageWrapperUser : styles.messageWrapperAi,
      ]}
    >
      <Text style={styles.senderName}>{item.sender}</Text>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAi,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.messageTextUser : styles.messageTextAi,
          ]}
        >
          {item.text}
        </Text>
        <Text style={isUser ? styles.timeUser : styles.timeAI}>
          {new Date(Number(item.id)).toLocaleTimeString()}
        </Text>
      </View>
      {isUser && item.status && (
        <Text style={{ fontSize: 12, marginTop: 2 }}>
          {item.status === "sending"
            ? "⏳"
            : item.status === "sent"
              ? "✅"
              : "❌"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  messageWrapper: {
    marginBottom: 15,
    maxWidth: "80%",
  },
  messageWrapperUser: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  messageWrapperAi: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  senderName: {
    fontSize: 12,
    color: "#627D98",
    marginBottom: 4,
    textTransform: "capitalize",
    fontWeight: "600",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: "#3182CE",
    borderBottomRightRadius: 4, // Makes the bubble point to the right
  },
  bubbleAi: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4, // Makes the bubble point to the left
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextUser: {
    color: "#FFFFFF",
  },
  messageTextAi: {
    color: "#2D3748",
  },
  timeAI: {
    color: "gray",
  },
  timeUser: {
    color: "#d2d2d2ff",
  },
});
