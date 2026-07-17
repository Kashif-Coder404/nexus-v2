import { useAppContext } from "@/context/provider";
import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";

export default function ChatInput() {
  const { message, setMessage, handleSend, isResponsed } = useAppContext();
  const isSendDisabled = !message || !isResponsed;

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={message}
        placeholder="Type a message..."
        placeholderTextColor="#64748B" // Slate placeholder
        onChangeText={setMessage}
        onSubmitEditing={!isSendDisabled ? handleSend : undefined}
        keyboardAppearance="dark" // Sleek iOS dark keyboard
      />
      <TouchableOpacity
        style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={isSendDisabled}
      >
        <Text style={styles.sendButtonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 16,
    backgroundColor: "#0D111A", // Dark container matching background
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "#1E293B", // Deep slate for message box
    borderRadius: 22,
    paddingHorizontal: 18,
    fontSize: 15,
    marginRight: 12,
    color: "#F8FAFC", // Bright text color
    borderWidth: 1,
    borderColor: "#334155",
  },
  sendButton: {
    backgroundColor: "#2563EB", // Vibrant blue
    borderRadius: 22,
    height: 44,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  sendButtonDisabled: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendingButtonState: {
    backgroundColor: "#D97706", // Amber warning color when sending
    opacity: 0.8,
  },
});
