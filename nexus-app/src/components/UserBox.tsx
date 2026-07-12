import React from "react";
import { Text, View, StyleSheet } from "react-native";

export interface UserProp {
  id: string;
  role: "user";
  message: string;
  content?: never;
  time: string;
  status: "sent" | "sending" | "error";
}

const UserBox = ({ id, role, message, time, status }: UserProp) => {
  const displayTime = isNaN(Number(time))
    ? time
    : new Date(Number(time)).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <View style={styles.userCont} className="user-cont" key={id}>
      <View style={styles.box} className="box">
        <Text style={styles.senderName} className="sender-name capitalize">
          {role}
        </Text>
        <View style={styles.msgBubble} className="msg-bubble">
          <Text style={styles.message} className="message">
            {message}
          </Text>
        </View>
        <Text style={styles.time} className="time capitalize">
          {displayTime}
        </Text>
      </View>
      <View style={styles.statusCont}>
        <Text
          style={[
            styles.statusText,
            status === "sending" && styles.statusSendingText,
            status === "error" && styles.statusErrorText,
          ]}
        >
          {status ? status.toUpperCase() : ""}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userCont: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  box: {
    backgroundColor: "#2563EB", // Vibrant blue
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4, // Chat bubble tail
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  senderName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#93C5FD",
    marginBottom: 2,
    textTransform: "capitalize",
  },
  msgBubble: {
    marginVertical: 2,
  },
  message: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  time: {
    fontSize: 10,
    color: "#BFDBFE",
    marginTop: 4,
    textAlign: "right",
    textTransform: "capitalize",
  },
  statusCont: {
    marginTop: 2,
    alignSelf: "flex-end",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#22c55e", // Tailwind green-500 for sent
  },
  statusErrorText: {
    color: "#ef4444", // Tailwind red-500 for error
  },
  statusSendingText: {
    color: "#94a3b8", // Tailwind slate-400 for sending
  },
});

export default UserBox;
